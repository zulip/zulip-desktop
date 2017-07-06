'use strict';

const ConfigUtil = require(__dirname + '/utils/config-util.js');

const NativeNotification = window.Notification;

class SilentNotification extends NativeNotification {
	constructor(title, opts) {
		opts.silent = ConfigUtil.getConfigItem('silent') || false;
		super(title, opts);
	}
}

window.Notification = SilentNotification;
