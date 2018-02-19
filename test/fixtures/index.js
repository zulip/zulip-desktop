const electron = require('electron');
const { Application } = require('spectron');
const path = require('path');
const rimraf = require('rimraf');

// make sure to pass --no-electron-connect so app
// doesn't reload during tests.
const electronAppArgs = [
  path.join(__dirname, '..'),
  '--disable-http-cache',
  '--no-electron-connect'
]

function createApp() {
  this.app = new Application({
    path: electron,
    args: electronAppArgs,
    env: { NODE_ENV: 'test' }
  });
  return this.app.start();
}

function closeApp() {
  const { app } = this;
  if (app && app.isRunning()) {
    return app.stop()
  }
}

// from test-e2e/setup.js detect app dir and reset it.
function getAppDataDir() {
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
  return path.join(base, 'ZulipTest')
}

// Resets the test directory, containing domain.json, window-state.json, etc
function resetTestDataDir () {
  appDataDir = getAppDataDir()
  rimraf.sync(appDataDir)
  rimraf.sync(path.join(__dirname, 'package.json'))
}

function waitFor(ms = 5000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  createApp,
  closeApp,
  resetTestDataDir,
  waitFor
};
