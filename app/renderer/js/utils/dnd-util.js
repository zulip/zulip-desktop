'use strict';

const ConfigUtil = require(__dirname + '/config-util.js');

function toggle() {
	const dnd = !ConfigUtil.getConfigItem('dnd', false);
	const dndSettingList = ['showNotification', 'silent'];
	if (process.platform === 'win32') {
		dndSettingList.push('flashTaskbarOnMessage');
	}

	let newSettings;
	if (dnd) {
		const oldSettings = {};
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

module.exports = {
	toggle
};
