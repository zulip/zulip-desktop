const Application = require('spectron').Application
const cpFile = require('cp-file')
const fs = require('fs')
const isCI = require('is-ci')
const looksSame = require('looks-same')
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
  const jsToScrollToBottomOfPage = 'window.scrollTo(0,document.body.scrollHeight);'
  // console.log(
  //   'exec js is',
  //   // app.webContents.executeJavaScript(jsToScrollToBottomOfPage + jsToRemoveScrollbars)
  // )

  // Remove cursor from page before taking a screenshot
  // const jsToRemoveBlinkingCursor = 'setImmediate(function blur() { document.activeElement.blur(); })'
  // app.webContents.executeJavaScript(jsToRemoveBlinkingCursor)

  const ssDir = path.join(__dirname, 'screenshots', process.platform)
  const ssPath = path.join(ssDir, name + '.png')
  let ssBuf

  try {
    ssBuf = fs.readFileSync(ssPath)
  } catch (err) {
    ssBuf = Buffer.alloc(0)
  }
  return app
    .webContents
    .executeJavaScript(jsToScrollToBottomOfPage + jsToRemoveScrollbars)
    .then(function () {
    return app.browserWindow.capturePage()
  }).then(function (buffer) {
    if (ssBuf.length === 0) {
      console.log('Saving screenshot ' + ssPath)
      fs.writeFileSync(ssPath, buffer)

      /**
       * If you don't have a base screenshot nor the dev environment for a specific platform
       * then you can log the image base64 string, copy and save it as an image locally on your
       * machine in order to generate base images for a test for specific platform
       */
      if(isCI) {
        console.log('Screenshot Image as base64 string:', buffer.toString('base64'))
      }
    } else {
      looksSame(ssBuf, buffer, {ignoreCaret: true}, function (error, match) {
        console.log('PNG ERRRR', error)
        t.ok(match, 'screenshot comparison ' + name)
        if (!match) {
          console.log()
          
          if (isCI) {
            console.log('Failed image base64 as string:', buffer.toString('base64'))
          } else {
            const ssFailedPath = path.join(ssDir, name + '-failed.png')
            console.log('Saving screenshot, failed comparison: ' + ssFailedPath)
            fs.writeFileSync(ssFailedPath, buffer)
          }
        /**
         * Uncomment lines below to get screenshot diff between -failed and saved image
         * https://github.com/gemini-testing/looks-same#building-diff-image
         */
        //   looksSame.createDiff({
        //     reference: ssBuf,
        //     current: buffer,
        //     ignoreCaret: true,
        //     diff: path.join(ssDir, name + '-diff.png'),
        //     highlightColor: '#ff00ff', //color to highlight the differences 
        //     strict: false, //strict comparsion 
        //     tolerance: 4
        // }, function(error) {
        // })
        }
      })
    }
  })
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