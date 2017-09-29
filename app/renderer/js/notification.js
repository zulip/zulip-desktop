'use strict';

const { remote } = require('electron');

const ConfigUtil = require(__dirname + '/utils/config-util.js');

const app = remote.app;

// From https://github.com/felixrieseberg/electron-windows-notifications#appusermodelid
// On windows 8 we have to explicitly set the appUserModelId otherwise notification won't work.
app.setAppUserModelId('org.zulip.zulip-electron');

const NativeNotification = window.Notification;

class baseNotification extends NativeNotification {
	constructor(title, opts) {
		opts.silent = ConfigUtil.getConfigItem('silent') || false;
		super(title, opts);
	}
	static requestPermission() {
		return; // eslint-disable-line no-useless-return
	}
	// Override default Notification permission
	static get permission() {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}
}

window.Notification = baseNotification;

