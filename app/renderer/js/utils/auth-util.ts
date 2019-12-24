import { remote } from 'electron';

import otpGenerator = require('otp-generator');

const { shell } = remote;

class AuthUtil {
	startAuth = (domain: string) => {
		const otp = otpGenerator.generate(64, { upperCase: false, specialChars: false });
		if (!domain.endsWith('/')) {
			domain += '/';
		}
		shell.openExternal(`${domain}accounts/login/?desktop_flow_otp=${otp}`);
	};
}

export = new AuthUtil();
