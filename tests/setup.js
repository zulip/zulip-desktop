const Application = require('spectron').Application
const cpFile = require('cp-file')
const fs = require('fs')
const isCI = require('is-ci')
const mkdirp = require('mkdirp')
const path = require('path')
const rimraf = require('rimraf')

const config = require('./config')

module.exports = {
  createApp,
  endTest,
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
