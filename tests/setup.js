const Application = require('spectron').Application
const cpFile = require('cp-file')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const PNG = require('pngjs').PNG
const rimraf = require('rimraf')

const config = require('./config')

module.exports = {
  createApp,
  endTest,
  screenshotCreateOrCompare,
  waitForLoad,
  wait,
  resetTestDataDir
}

// Runs Zulip Desktop.
// Returns a promise that resolves to a Spectron Application once the app has loaded.
// Takes a Tape test. Makes some basic assertions to verify that the app loaded correctly.
function createApp (t) {
  generateTestAppPackageJson()
  return new Application({
    path: path.join(__dirname, '..', 'node_modules', '.bin',
      'electron' + (process.platform === 'win32' ? '.cmd' : '')),
    args: [path.join(__dirname)], // Ensure this dir has a package.json file with a 'main' entry piont
    env: {NODE_ENV: 'test'},
    waitTimeout: 10e3
  })
}

// Generates package.json for test app
// Reads app package.json and updates the productName to config.TEST_APP_PRODUCT_NAME 
// We do this so that the app integration doesn't doesn't share the same appDataDir as the dev application
function generateTestAppPackageJson () {
  let packageJson = require(path.join(__dirname, '../package.json'))
  packageJson.productName = config.TEST_APP_PRODUCT_NAME
  packageJson.main = '../app/main'

  const testPackageJsonPath = path.join(__dirname, 'package.json')
  fs.writeFileSync(testPackageJsonPath, JSON.stringify(packageJson, null, ' '), 'utf-8')
}

// Starts the app, waits for it to load, returns a promise
function waitForLoad (app, t, opts) {
  if (!opts) opts = {}
  return app.start().then(function () {
    return app.client.waitUntilWindowLoaded()
  })
  .then(function() {
    return app.client.pause(2000);
  })
  .then(function () {
    return app.webContents.getTitle()
  }).then(function (title) {
    t.equal(title, 'Zulip', 'html title')
  })
}

// Returns a promise that resolves after 'ms' milliseconds. Default: 1 second
function wait (ms) {
  if (ms === undefined) ms = 1000 // Default: wait long enough for the UI to update
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, ms)
  })
}

// Quit the app, end the test, either in success (!err) or failure (err)
function endTest (app, t, err) {
  return app.stop().then(function () {
    t.end(err)
  })
}

// Takes a screenshot of the app
// If we already have a reference under test/screenshots, assert that they're the same
// Otherwise, create the reference screenshot: test/screenshots/<platform>/<name>.png
function screenshotCreateOrCompare (app, t, name) {
  // Prep view for screenshot. Remove blinking cursor and auto-hiding scrollbars
  // to ensure screen shots will be consistent across different OSs
  const jsToRemoveScrollbars = "_webviews=document.querySelectorAll('webview');_webviews.forEach((w)=>w.insertCSS('::-webkit-scrollbar { display: none; }'))"
  app.webContents.executeJavaScript(jsToRemoveScrollbars)

  // Remove cursor from page before taking a screenshot
  const jsToRemoveBlinkingCursor = 'setImmediate(function blur() { document.activeElement.blur(); })'
  app.webContents.executeJavaScript(jsToRemoveBlinkingCursor)

  const ssDir = path.join(__dirname, 'screenshots', process.platform)
  const ssPath = path.join(ssDir, name + '.png')
  let ssBuf

  try {
    ssBuf = fs.readFileSync(ssPath)
  } catch (err) {
    ssBuf = Buffer.alloc(0)
  }
  return wait().then(function () {
    return app.browserWindow.capturePage()
  }).then(function (buffer) {
    if (ssBuf.length === 0) {
      console.log('Saving screenshot ' + ssPath)
      fs.writeFileSync(ssPath, buffer)
      console.log('Screenshot Image as base64 string:', buffer.toString('base64'))
    } else {
      const match = compareIgnoringTransparency(buffer, ssBuf)
      t.ok(match, 'screenshot comparison ' + name)
      if (!match) {
        const ssFailedPath = path.join(ssDir, name + '-failed.png')
        console.log('Saving screenshot, failed comparison: ' + ssFailedPath)
        fs.writeFileSync(ssFailedPath, buffer)
        console.log('Failed Image:', buffer.toString('base64'))
      }
    }
  })
}

// Compares two PNGs, ignoring any transparent regions in bufExpected.
// Returns true if they match.
// Credit to WebTorrent-desktop project for this img compare method
function compareIgnoringTransparency (bufActual, bufExpected) {
  // Common case: exact byte-for-byte match
  if (Buffer.compare(bufActual, bufExpected) === 0) return true

  // Otherwise, compare pixel by pixel
  let sumSquareDiff = 0
  let numDiff = 0
  const pngA = PNG.sync.read(bufActual)
  const pngE = PNG.sync.read(bufExpected)
  if (pngA.width !== pngE.width || pngA.height !== pngE.height) {
    console.log('Screenshot W x H dim comparison failed')
    console.log('Expected png width:', pngE.width, 'height:', pngE.height)
    console.log('Actual png width:', pngA.width, 'height:', pngA.height)
    return false
  }
  const w = pngA.width
  const h = pngE.height
  const da = pngA.data
  const de = pngE.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y * w) + x) * 4
      if (de[i + 3] === 0) continue // Skip transparent pixels
      const ca = (da[i] << 16) | (da[i + 1] << 8) | da[i + 2]
      const ce = (de[i] << 16) | (de[i + 1] << 8) | de[i + 2]
      if (ca === ce) continue

      // Add pixel diff to running sum
      // This is necessary on Windows, where rendering apparently isn't quite deterministic
      // and a few pixels in the screenshot will sometimes be off by 1. (Visually identical.)
      numDiff++
      sumSquareDiff += (da[i] - de[i]) * (da[i] - de[i])
      sumSquareDiff += (da[i + 1] - de[i + 1]) * (da[i + 1] - de[i + 1])
      sumSquareDiff += (da[i + 2] - de[i + 2]) * (da[i + 2] - de[i + 2])
    }
  }
  const rms = Math.sqrt(sumSquareDiff / (numDiff + 1))
  const l2Distance = Math.round(Math.sqrt(sumSquareDiff))
  console.log('screenshot diff l2 distance: ' + l2Distance + ', rms: ' + rms)
  return l2Distance < 5000 && rms < 100
}

function getAppDataDir () {
  let base

  if (process.platform === 'darwin') {
    base = path.join(process.env.HOME, 'Library', 'Application Support')
  } else if (process.platform === 'linux') {
    base = process.env.XDG_CONFIG_HOME ?
      process.env.XDG_CONFIG_HOME : path.join(process.env.HOME, '.config')
  } else if (process.platform === 'win32') {
    base = process.env.APPDATA
  } else {
    console.log('Could not detect app data dir base. Exiting...')
    process.exit(1)
  }
  console.log('Detected App Data Dir base:', base)
  return path.join(base, config.TEST_APP_PRODUCT_NAME)
}

// Resets the test directory, containing domain.json, window-state.json, etc
function resetTestDataDir () {
  appDataDir = getAppDataDir()
  rimraf.sync(appDataDir)
  rimraf.sync(path.join(__dirname, 'package.json'))
}