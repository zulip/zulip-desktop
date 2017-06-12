'use strict';

const {app} = require('electron').remote;

const os = require('os');

let instance = null;

class SystemUtil {
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

	getOS() {
		if (os.platform() === 'darwin') {
			return 'Mac';
		}
		if (os.platform() === 'linux') {
			return 'Linux';
		}
		if (os.platform() === 'win32' || os.platform() === 'win64') {
			if (parseFloat(os.release()) < 6.2) {
				return 'Windows 7';
			} else {
				return 'Windows 10';
			}
		}
	}

	setUserAgent(webViewUserAgent) {
		this.userAgent = 'ZulipElectron/' + app.getVersion() + ' ' + webViewUserAgent;
	}

	getUserAgent() {
		return this.userAgent;
	}
}

module.exports = SystemUtil;
