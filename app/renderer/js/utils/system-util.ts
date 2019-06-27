'use strict';
import { remote } from 'electron';

import os = require('os');

const { app } = remote;
let instance: null | SystemUtil = null;

class SystemUtil {
	connectivityERR: string[];

	userAgent: string | null;

	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.connectivityERR = [
			'ERR_INTERNET_DISCONNECTED',
			'ERR_PROXY_CONNECTION_FAILED',
			'ERR_CONNECTION_RESET',
			'ERR_NOT_CONNECTED',
			'ERR_NAME_NOT_RESOLVED',
			'ERR_NETWORK_CHANGED'
		];
		this.userAgent = null;

		return instance;
	}

	getOS(): string {
		const platform = os.platform();
		if (platform === 'darwin') {
			return 'Mac';
		} else if (platform === 'linux') {
			return 'Linux';
		} else if (platform === 'win32') {
			if (parseFloat(os.release()) < 6.2) {
				return 'Windows 7';
			} else {
				return 'Windows 10';
			}
		} else {
			return '';
		}
	}

	setUserAgent(webViewUserAgent: string): void {
		this.userAgent = `ZulipElectron/'${app.getVersion()}${webViewUserAgent}`;
	}

	getUserAgent(): string | null {
		return this.userAgent;
	}
}

export = new SystemUtil();
