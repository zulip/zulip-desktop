import * as ConfigUtil from './config-util';
import {ipcRenderer} from 'electron';
import schedule from 'node-schedule';
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

/*	Node-schedule job instance accepts time parameter and schedules to turn off DND
	and pops a toast that DND has ended. Cancel a pre-existing job before scheduling a new one. */
let job: schedule.Job = null;

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
		ConfigUtil.setConfigItem('dndSwitchOff', null);
		if (job !== null) {
			job.cancel();
		}
	}

	for (const settingName of dndSettingList) {
		ConfigUtil.setConfigItem(settingName, newSettings[settingName]);
	}

	ConfigUtil.setConfigItem('dnd', dnd);
	return {dnd, newSettings};
}

/*	Create the DND menu and closed it when focussed out. */
export const makeMenu = (): void => {
	const actionsContainer = document.querySelector('#actions-container');
	const dndExist = document.querySelectorAll('.dnd-menu');
	if (dndExist.length === 0) {
		const dndMenu = document.createElement('ul');
		dndMenu.className = 'dnd-menu';
		const dndOptions: {[key: string]: string} = {
			'30 Minutes': 'thirty_min',
			'1 Hour': 'one_hr',
			'6 Hours': 'six_hr',
			'12 Hours': 'twelve_hr',
			'Until I Resume': 'custom'
		};

		Object.keys(dndOptions).forEach(key => {
			const opt = document.createElement('li');
			opt.className = 'dnd-time-btn';
			opt.innerHTML = key;
			opt.id = dndOptions[key];
			opt.addEventListener('click', () => {
				configureDND(opt, dndMenu);
			}, false);
			dndMenu.append(opt);
		});
		actionsContainer.append(dndMenu);

		const dndMenuFocusOut = (event: Event) => {
			console.log(event);
			if ((event.target as HTMLLIElement).innerHTML !== 'notifications') {
				dndMenu.remove();
				document.removeEventListener('click', dndMenuFocusOut);
			}
		};

		document.addEventListener('keydown', event => {
			if (event.key === 'Escape') {
				dndMenu.remove();
				document.removeEventListener('click', dndMenuFocusOut);
			}
		});
		document.addEventListener('click', dndMenuFocusOut);
	}
};

/*	Configure DND as per user's selected option and pops a toast showing dnd switch off time. */
const configureDND = (opt: HTMLLIElement, dndMenu: HTMLUListElement): void => {
	let dndOffTime;
	dndOffTime = new Date();
	const optionElement = document.querySelector('#' + opt.id);
	dndMenu.style.height = '75px';
	optionElement.className = 'dnd-options-btn';
	switch (opt.id) {
		case 'thirty_min':
			dndOffTime.setMinutes(dndOffTime.getMinutes() + 30);
			break;
		case 'one_hr':
			dndOffTime.setMinutes(dndOffTime.getMinutes() + 60);
			break;
		case 'six_hr':
			dndOffTime.setMinutes(dndOffTime.getMinutes() + 360);
			break;
		case 'twelve_hr':
			dndOffTime.setMinutes(dndOffTime.getMinutes() + 720);
			break;
		default:
			dndOffTime = null;
			break;
	}

	ConfigUtil.setConfigItem('dndSwitchOff', dndOffTime);

	dndMenu.remove();
	showDNDTimeLeft();
	setDNDTimer();
	const state = toggle();
	ipcRenderer.send('forward-message', 'toggle-dnd', state.dnd, state.newSettings);
};

/*	Fetch DND switch off time and toggle DND off if the time has elapsed. */
export const setDNDTimer = (): void => {
	const dbTime = ConfigUtil.getConfigItem('dndSwitchOff');
	if (dbTime !== null) {
		const time = new Date(dbTime);
		// Handle the case when user closes the app before switch off time and stars it after the time has elapsed.
		if (time < new Date()) {
			toggle();
			return;
		}

		if (job !== null) {
			job.cancel();
		}

		job = schedule.scheduleJob(time, () => {
			ConfigUtil.setConfigItem('dndSwitchOff', null);
			const state = toggle();
			ipcRenderer.send('forward-message', 'toggle-dnd', state.dnd, state.newSettings);
			showToast('DND has ended');
		});
	}
};

/*	Show a toast with the clock time when DND will go off. */
export const showDNDTimeLeft = (): void => {
	const check = ConfigUtil.getConfigItem('dndSwitchOff');
	if (check !== null) {
		const dbTime = new Date(check);
		const timeLeft = `DND goes off at ${dbTime.getHours()} : ${(dbTime.getMinutes() < 10 ? (`0${dbTime.getMinutes()}`) : dbTime.getMinutes())}`;
		showToast(timeLeft);
	}
};

export const showToast = (t: string): void => {
	const actionsContainer = document.querySelector('#actions-container');
	const toast = document.createElement('p');
	toast.className = 'toast';
	toast.innerHTML = t;
	actionsContainer.append(toast);
	setTimeout(() => toast.remove(), 4000);
};
