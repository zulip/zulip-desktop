import { ipcRenderer } from 'electron';

import os from 'os';

export const connectivityERR: string[] = [
	'ERR_INTERNET_DISCONNECTED',
	'ERR_PROXY_CONNECTION_FAILED',
	'ERR_CONNECTION_RESET',
	'ERR_NOT_CONNECTED',
	'ERR_NAME_NOT_RESOLVED',
	'ERR_NETWORK_CHANGED'
];

const userAgent = ipcRenderer.sendSync('fetch-user-agent');

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
export function getUserAgent(): string {
	return userAgent;
}
