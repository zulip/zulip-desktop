const test = require('tape')
const setup = require('./setup')

// Create new org link should open in the default browser [WIP]

test('new-org-link', function (t) {
  t.timeoutAfter(50e3)
  setup.resetTestDataDir()
  const app = setup.createApp()
  setup.waitForLoad(app, t)
    .then(() => app.client.windowByIndex(1)) // focus on webview
    .then(() => app.client.click('#open-create-org-link')) // Click on new org link button
    .then(() => setup.wait(5000))
    .then(() => setup.endTest(app, t),
          (err) => setup.endTest(app, t, err || 'error'))
})

