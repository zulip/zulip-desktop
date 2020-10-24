import {app} from 'electron';

import AutoLaunch from 'auto-launch';
import isDev from 'electron-is-dev';

import * as ConfigUtil from '../renderer/js/utils/config-util';

export const setAutoLaunch = async (AutoLaunchValue: boolean): Promise<void> => {
	// Don't run this in development
	if (isDev) {
		return;
	}

	const autoLaunchOption = ConfigUtil.getConfigItem('startAtLogin', AutoLaunchValue);

	// `setLoginItemSettings` doesn't support linux
	if (process.platform === 'linux') {
		const ZulipAutoLauncher = new AutoLaunch({
			name: 'Zulip',
			isHidden: false
		});
		await (autoLaunchOption ? ZulipAutoLauncher.enable() : ZulipAutoLauncher.disable());
	} else {
		app.setLoginItemSettings({
			openAtLogin: autoLaunchOption,
			openAsHidden: false
		});
	}
};
