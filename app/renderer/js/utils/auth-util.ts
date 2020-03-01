import { remote } from 'electron';

import cryptoRandomString = require('crypto-random-string');
import ConfigUtil = require('./config-util');

const { shell } = remote;

class AuthUtil {
	openInBrowser = (link: string): void => {
		const otp = cryptoRandomString({length: 64});
		ConfigUtil.setConfigItem('desktopOtp', otp);
		shell.openExternal(`${link}?desktop_flow_otp=${otp}`);
	};

	xorStrings = (a: string, b: string): string => {
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

	hexToAscii = (hex: string): string => {
		let ascii = '';
		for (let i = 0; i < hex.length; i += 2) {
			ascii += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
		}
		return ascii;
	};
}

export = new AuthUtil();
