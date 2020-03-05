import { remote } from 'electron';

import cryptoRandomString from 'crypto-random-string';
import * as ConfigUtil from './config-util';

const { shell } = remote;

export const openInBrowser = (link: string): void => {
	const otp = cryptoRandomString({length: 64});
	ConfigUtil.setConfigItem('desktopOtp', otp);
	shell.openExternal(`${link}?desktop_flow_otp=${otp}`);
};

export const xorStrings = (a: string, b: string): string => {
	if (a.length === b.length) {
		return a
			.split('')
			.map((char, i) => (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(16))
			.join('')
			.toUpperCase();
	} else {
		return '';
	}
};

export const hexToAscii = (hex: string): string => {
	let ascii = '';
	for (let i = 0; i < hex.length; i += 2) {
		ascii += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
	}
	return ascii;
};
