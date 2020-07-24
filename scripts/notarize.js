'use strict';
const path = require('path');

const dotenv = require('dotenv');
const {notarize} = require('electron-notarize');

dotenv.config({path: path.join(__dirname, '/../.env')});

exports.default = async function (context) {
	const {electronPlatformName, appOutDir} = context;
	if (electronPlatformName !== 'darwin') {
		return;
	}

	const appName = context.packager.appInfo.productFilename;

	return notarize({
		appBundleId: 'org.zulip.zulip-electron',
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_ID_PASS,
		ascProvider: process.env.ASC_PROVIDER // Team short name
	});
};
