import { remote } from 'electron';

import otpGenerator = require('otp-generator');
import ConfigUtil = require('./config-util');

const { shell } = remote;

class AuthUtil {
	startAuth = (domain: string) => {
		const otp = otpGenerator.generate(64, { upperCase: false, specialChars: false });
		if (!domain.endsWith('/')) {
			domain += '/';
		}
		ConfigUtil.setConfigItem('desktopOtp', otp);
		shell.openExternal(`${domain}accounts/login/?desktop_flow_otp=${otp}`);
	};

	xorStrings = (a: string, b: string): string => {
		let res = '';
		let i = a.length;
		let j = b.length;
		while (i-- > 0 && j-- > 0) {
			res = (parseInt(a.charAt(i), 16) ^ parseInt(b.charAt(j), 16)).toString(16) + res;
		}
		return res;
	};
}

export = new AuthUtil();
