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
/*
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
*/
	it('sets up a default organization', function () {
		let app = this.app
		app.client.execute(() => {
			window.confirm = function () { return true }
		})

		return this.app.client.waitUntilWindowLoaded(5000)
			.pause(1000)
			.windowHandles()
			.then(function (session) {
				console.log(session)
				this.window(session.value[1])
			})
			.click('#new-server-action')
			.setValue('input[id="server-info-name"]', 'Zulip')
			.setValue('input[id="server-info-url"]', 'chat.zulip.org')
			.click('#save-server-action')
			.pause(500) // Need to pause while server verification takes place
			.then(() =>  app.browserWindow.reload())
			.pause(1000)
			.then(() => {
				// app.browserWindow.focus()
			})
	})
})

