const assert = require('assert')
const Application = require('spectron').Application
const chai = require('chai')
const { expect } = chai
const chaiAsPromised = require('chai-as-promised')

chai.should()
chai.use(chaiAsPromised)

describe('application launch', function () {
  this.timeout(15000)

  beforeEach(function () {
    this.app = new Application({
      path: require('electron'),
      args: [__dirname + '/../app/renderer/main.html']
    })
    return this.app.start()
  })

  beforeEach(function () {
    chaiAsPromised.transferPromiseness = this.app.transferPromiseness
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('shows an initial window', function () {
     return this.app.client.waitUntilWindowLoaded(5000)
      .getWindowCount().should.eventually.equal(2)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
  })

	it('sets up a default organization', function () {
		let app = this.app
		let self = this
		app.client.execute(() => {
			window.confirm = function () { return true }
		})

		function createOrg (client, name, url, winIndex) {
			return client
				// Focus on settings webview
				.then(switchToWebviewAtIndex.bind(null, self.app.client, winIndex))
				.pause(1000) // wait for settings to load

				// Fill settings form
				.click('#new-server-action')
				.setValue('input[id="server-info-name"]', name)
				.setValue('input[id="server-info-url"]', url)
				.click('#save-server-action')
				.pause(500) // Need to pause while server verification takes place
				.then(() =>  app.browserWindow.reload())
			  .pause(1500) // Wait for webview of org to load
		}

		function switchToWebviewAtIndex(client, index) {
			return client
			.windowHandles()
			.then(function (session) {
				this.window(session.value[index])
			})
		}

		return this.app.client.waitUntilWindowLoaded(5000)
			.then(() => createOrg(self.app.client, 'Zulip 1', 'chat.zulip.org', 1))
			.then(switchToWebviewAtIndex.bind(null, self.app.client, 0))
			.click('#add-action > i').pause(500)
			.then(switchToWebviewAtIndex.bind(null, self.app.client, 2))
			.then(() => createOrg(self.app.client, 'Zulip 2', 'chat.zulip.org', 2))
	})
})

