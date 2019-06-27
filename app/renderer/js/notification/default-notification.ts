'use strict';

import { ipcRenderer } from 'electron';
import { focusCurrentServer } from './helpers';

import ConfigUtil = require('../utils/config-util');

const NativeNotification = window.Notification;
class BaseNotification extends NativeNotification {
	constructor(title: string, opts: NotificationOptions) {
		opts.silent = true;
		super(title, opts);

		this.addEventListener('click', () => {
			// focus to the server who sent the
			// notification if not focused already
			focusCurrentServer();
			ipcRenderer.send('focus-app');
		});
	}

	static requestPermission(): void {
		return; // eslint-disable-line no-useless-return
	}

	// Override default Notification permission
	static get permission(): NotificationPermission {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}
}

export = BaseNotification;
