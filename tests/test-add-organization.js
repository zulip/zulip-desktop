'use strict';
const test = require('tape');

const setup = require('./setup');

test('add-organization', async t => {
	t.timeoutAfter(50e3);
	setup.resetTestDataDir();
	const app = setup.createApp();
	try {
		await setup.waitForLoad(app, t);
		await app.client.windowByIndex(1); // Focus on webview
		await (await app.client.$('.setting-input-value')).setValue('chat.zulip.org');
		await (await app.client.$('#connect')).click();
		await setup.wait(5000);
		await app.client.windowByIndex(0); // Switch focus back to main win
		await app.client.windowByIndex(1); // Switch focus back to org webview
		await (await app.client.$('//*[@id="id_username"]')).waitForExist();
		await setup.endTest(app, t);
	} catch (error) {
		await setup.endTest(app, t, error || 'error');
	}
});
