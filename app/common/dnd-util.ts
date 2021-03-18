import * as ConfigUtil from './config-util';

type SettingName = 'showNotification' | 'silent' | 'flashTaskbarOnMessage';

export interface DNDSettings {
	showNotification?: boolean;
	silent?: boolean;
	flashTaskbarOnMessage?: boolean;
}

interface Toggle {
	dnd: boolean;
	newSettings: DNDSettings;
}

export function toggle(): Toggle {
	const dnd = !ConfigUtil.getConfigItem('dnd', false);
	const dndSettingList: SettingName[] = ['showNotification', 'silent'];
	if (process.platform === 'win32') {
		dndSettingList.push('flashTaskbarOnMessage');
	}

	let newSettings: DNDSettings;
	if (dnd) {
		const oldSettings: DNDSettings = {};
		newSettings = {};

		// Iterate through the dndSettingList.
		for (const settingName of dndSettingList) {
			// Store the current value of setting.
			oldSettings[settingName] = ConfigUtil.getConfigItem(settingName);
			// New value of setting.
			newSettings[settingName] = (settingName === 'silent');
		}

		// Store old value in oldSettings.
		ConfigUtil.setConfigItem('dndPreviousSettings', oldSettings);
	} else {
		newSettings = ConfigUtil.getConfigItem('dndPreviousSettings');
	}

	for (const settingName of dndSettingList) {
		ConfigUtil.setConfigItem(settingName, newSettings[settingName]);
	}

	ConfigUtil.setConfigItem('dnd', dnd);
	return {dnd, newSettings};
}
