'use strict';

const ConfigUtil = require(__dirname + '/config-util.js');

const {ipcRenderer} = require('electron');

let count = 0, dnd, newSettings;
function makeView() {
	let time = -1, dndOffTime = {
			hr: new Date().getHours(),
			min: new Date().getMinutes(),
			carry: 0 // for dnd switch on after midnight 0 am
		};
	const timeDisableDNDInput = document.createElement('div');
	const actionContainer = document.getElementById('actions-container');
	timeDisableDNDInput.className = 'dndInput';
	for (let i = 1; i <= 4; i++) {
		const opt = document.createElement('span');
		if (i === 1) {
			opt.innerHTML = 'For 1 hour<br/>';
			opt.id = 'dnd_1';
		} else if (i === 2) {
			opt.innerHTML = 'For 8 hour<br/>';
			opt.id = 'dnd_2';
		} else if (i === 3) {
			opt.innerHTML = 'For 12 hour<br/>';
			opt.id = 'dnd_3';
		} else if (i === 4) {
			opt.innerHTML = 'Until I resume<br/>';
			opt.id = 'dnd_4';
		}
		opt.addEventListener('click', element, false);
		timeDisableDNDInput.appendChild(opt);
		actionContainer.appendChild(timeDisableDNDInput);
		function element() {
			const optionElement = document.getElementById(opt.id);
			optionElement.className = 'dndOptionsSelect';
			if (opt.id === 'dnd_1') {
				time = 1;
			} else if (opt.id === 'dnd_2') {
				time = 8;
			} else if (opt.id === 'dnd_3') {
				time = 12;
			} else {
				time = -1;
			}
			if (time > 0) {
				dndOffTime.hr += time;
				if (dndOffTime.hr > 24) {
					dndOffTime.hr -= 24;
					dndOffTime.carry += 1; 
				}
				ConfigUtil.setConfigItem('dndSwitchOff', dndOffTime);
			} else {
				ConfigUtil.setConfigItem('dndSwitchOff', null);
			}
			const doneButton = document.createElement('button');
			doneButton.className = 'dndButton';
			doneButton.innerHTML = 'Done';
			doneButton.onclick = () => {
				setTimeout(() => {
					timeDisableDNDInput.removeChild(doneButton);
					actionContainer.removeChild(timeDisableDNDInput);
					checkDNDstate();
				}, 500);
			};
			timeDisableDNDInput.appendChild(doneButton);
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDNDstate() {
	const check = ConfigUtil.getConfigItem('dndSwitchOff');
	if (check !== null && typeof check === 'object') {
		if (check.carry && (new Date().getHours() === 0)) { // for dnd operations ending after midnight
			check.carry = 0;
		}
		if (check.min <= (new Date().getMinutes())) {
			if ((check.hr + (24 * check.carry)) <= (new Date().getHours())) {
				toggle();
				sleep(1000).then(() => {
					ipcRenderer.send('forward-message', 'toggle-dnd', dnd, newSettings);
					ConfigUtil.setConfigItem('dndSwitchOff', null);
				});
			}
		}
		setTimeout(checkDNDstate, 60 * 1000); // keeps running unless DND is switched off by the timer
	}
}

function toggle() {
	const dnd = !ConfigUtil.getConfigItem('dnd', false);
	const dndSettingList = ['showNotification', 'silent'];
	if (process.platform === 'win32') {
		dndSettingList.push('flashTaskbarOnMessage');
	}
	if (dnd) { //executesWhenOffisCLicked
		count++;
		if (count) {
			makeView();
		}
		const oldSettings = {};
		newSettings = {};
		// Iterate through the dndSettingList.
		for (const settingName of dndSettingList) {
			// Store the current value of setting.\
			oldSettings[settingName] = ConfigUtil.getConfigItem(settingName);
			// New value of setting.
			newSettings[settingName] = (settingName === 'silent');
		}
		// Store old value in oldSettings.
		ConfigUtil.setConfigItem('dndPreviousSettings', oldSettings);
	} else {
		newSettings = ConfigUtil.getConfigItem('dndPreviousSettings');
		ConfigUtil.setConfigItem('dndSwitchOff', null);
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
