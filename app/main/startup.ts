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

	const autoLaunchOption = ConfigUtil.getConfigItem('startAtLogin', AutoLaunchValue);

	// setLoginItemSettings doesn't support linux
	if (process.platform === 'linux') {
		const ZulipAutoLauncher = new AutoLaunch({
			name: 'Zulip',
			isHidden: false
		});
		if (autoLaunchOption) {
			ZulipAutoLauncher.enable();
		} else {
			ZulipAutoLauncher.disable();
		}
	} else {
		app.setLoginItemSettings({
			openAtLogin: autoLaunchOption,
			openAsHidden: false
		});
	}
};
