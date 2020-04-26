import { ipcRenderer } from 'electron';
import { focusCurrentServer } from './helpers';

import * as ConfigUtil from '../utils/config-util';

const NativeNotification = window.Notification;
export default class BaseNotification extends NativeNotification {
	constructor(title: string, options: NotificationOptions) {
		options.silent = true;
		super(title, options);

		this.addEventListener('click', () => {
			// Focus to the server who sent the
			// notification if not focused already
			focusCurrentServer();
			ipcRenderer.send('focus-app');
		});
	}

	static async requestPermission(): Promise<NotificationPermission> {
		return this.permission;
	}

	// Override default Notification permission
	static get permission(): NotificationPermission {
		return ConfigUtil.getConfigItem('showNotification') ? 'granted' : 'denied';
	}
}
