'use strict';
import { app } from 'electron';

import AutoLaunch = require('auto-launch');
import isDev = require('electron-is-dev');
import ConfigUtil = require('../renderer/js/utils/config-util');

export const setAutoLaunch = (AutoLaunchValue: boolean): void => {
	// Don't run this in development
	if (isDev) {
		return;
	}

	// On Mac, work around a bug in auto-launch where it opens a Terminal window
	// See https://github.com/Teamwork/node-auto-launch/issues/28#issuecomment-222194437

	const appPath = process.platform === 'darwin' ? app.getPath('exe').replace(/\.app\/Content.*/, '.app') : undefined; // Use the default

	const ZulipAutoLauncher = new AutoLaunch({
		name: 'Zulip',
		path: appPath,
		isHidden: false
	});
	const autoLaunchOption = ConfigUtil.getConfigItem('startAtLogin', AutoLaunchValue);

	if (autoLaunchOption) {
		ZulipAutoLauncher.enable();
	} else {
		ZulipAutoLauncher.disable();
	}
};
