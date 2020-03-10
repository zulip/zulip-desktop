import { remote } from 'electron';

import os from 'os';
import * as ConfigUtil from './config-util';

const { app } = remote;

export const connectivityERR: string[] = [
	'ERR_INTERNET_DISCONNECTED',
	'ERR_PROXY_CONNECTION_FAILED',
	'ERR_CONNECTION_RESET',
	'ERR_NOT_CONNECTED',
	'ERR_NAME_NOT_RESOLVED',
	'ERR_NETWORK_CHANGED'
];

let userAgent: string | null = null;

export function getOS(): string {
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

export function setUserAgent(webViewUserAgent: string): void {
	userAgent = `ZulipElectron/${app.getVersion()} ${webViewUserAgent}`;
}

export function getUserAgent(): string | null {
	if (!userAgent) {
		setUserAgent(ConfigUtil.getConfigItem('userAgent', null));
	}
	return userAgent;
}
