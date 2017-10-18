const test = require('tape')
const setup = require('./setup')

test('add-organization', function (t) {
  t.timeoutAfter(30e3)
  setup.resetTestDataDir()
  const app = setup.createApp()
  setup.waitForLoad(app, t)
    .then(() => app.client.windowByIndex(1)) // focus on webview
    .then(() => app.client.setValue('.setting-input-value', 'chat.zulip.org'))
    .then(() => app.client.click('.server-save-action'))
    .then(() => setup.wait(5000))
    .then(() => app.client.windowByIndex(0)) // Switch focus back to main win
    .then(() => setup.screenshotCreateOrCompare(app, t, 'add-organization'))
    .then(() => setup.endTest(app, t),
          (err) => setup.endTest(app, t, err || 'error'))
})

