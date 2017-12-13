const test = require('tape')
const setup = require('./setup')

test('app runs', function (t) {
  t.timeoutAfter(10e3)
  setup.resetTestDataDir()
  const app = setup.createApp()
  setup.waitForLoad(app, t)
    .then(() => app.client.windowByIndex(1)) // focus on webview
    .then(() => app.client.waitForExist('//*[@id="new-server-container"]/div/div/div[2]/input'))
    .then(() => setup.endTest(app, t),
          (err) => setup.endTest(app, t, err || 'error'))
})