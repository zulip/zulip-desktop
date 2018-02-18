const assert = require('assert');
const fixtures = require('./fixtures');

const {
  createApp, closeApp, resetTestDataDir
} = fixtures;

describe('app landing page tests', function () {
  this.timeout(10000);
  before(async function () {
    resetTestDataDir();
    await createApp.bind(this)();
    await this.app.client.waitUntilWindowLoaded();
  });

  after(function () {
    return closeApp.bind(this)();
  });

  it('should be able to sucessfully add a server', async function () {
    const {client} = this.app;

    await client.windowByIndex(1);
    await client.setValue('.setting-input-value', 'chat.zulip.org');
    await client.click('.server-save-action');
    await fixtures.waitFor(8000);
    await client.windowByIndex(0);

    let domains = await client.execute(() => {
      return DomainUtil.getDomains();
    });
    domains = domains.value;

    assert.deepStrictEqual(domains.length, 1,
      'Tests failed to add new server (chat.zulip.org).');
  });
});
