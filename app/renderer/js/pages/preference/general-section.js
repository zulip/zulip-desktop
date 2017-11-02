'use strict';
const path = require('path');

const { ipcRenderer } = require('electron');
const { app, dialog } = require('electron').remote;

const fs = require('fs-extra');

const BaseSection = require(__dirname + '/base-section.js');
const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

class GeneralSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
            <div class="settings-pane">
                <div class="title">Appearance</div>
                <div id="appearance-option-settings" class="settings-card">
					<div class="setting-row" id="tray-option">
						<div class="setting-description">Show app icon in system tray</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="sidebar-option">
						<div class="setting-description">Show sidebar (<span class="code">Cmd Or Ctrl+S</span>)</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="badge-option">
						<div class="setting-description">Show app unread badge</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="flash-taskbar-option" style= "display:${process.platform === 'win32' ? '' : 'none'}">
						<div class="setting-description">Flash taskbar on new message</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">Desktop Notification</div>
				<div class="settings-card">
					<div class="setting-row" id="show-notification-option">
						<div class="setting-description">Show Desktop Notifications</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="silent-option">
						<div class="setting-description">Mute all sounds from Zulip</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">App Updates</div>
                <div class="settings-card">
					<div class="setting-row" id="betaupdate-option">
						<div class="setting-description">Get beta updates</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">Functionality</div>
                <div class="settings-card">
					<div class="setting-row" id="startAtLogin-option">
						<div class="setting-description">Start app at login</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="enable-spellchecker-option">
					<div class="setting-description">Enable Spellchecker (requires restart)</div>
					<div class="setting-control"></div>
				</div>
				</div>
				<div class="title">Reset Application Data</div>
                <div class="settings-card">
					<div class="setting-row" id="resetdata-option">
						<div class="setting-description">This will delete all application data including all added accounts and preferences
						</div>
						<button class="reset-data-button blue">Reset App Data</button>
					</div>
				</div>
            </div>
		`;
	}

	init() {
		this.props.$root.innerHTML = this.template();
		this.updateTrayOption();
		this.updateBadgeOption();
		this.updateSilentOption();
		this.updateUpdateOption();
		this.updateSidebarOption();
		this.updateStartAtLoginOption();
		this.updateResetDataOption();
		this.showDesktopNotification();
		this.enableSpellchecker();

		// Platform specific settings
		// Flashing taskbar on Windows
		if (process.platform === 'win32') {
			this.updateFlashTaskbar();
		}
	}

	updateTrayOption() {
		this.generateSettingOption({
			$element: document.querySelector('#tray-option .setting-control'),
			value: ConfigUtil.getConfigItem('trayIcon', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('trayIcon');
				ConfigUtil.setConfigItem('trayIcon', newValue);
				ipcRenderer.send('forward-message', 'toggletray');
				this.updateTrayOption();
			}
		});
	}

	updateBadgeOption() {
		this.generateSettingOption({
			$element: document.querySelector('#badge-option .setting-control'),
			value: ConfigUtil.getConfigItem('badgeOption', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('badgeOption');
				ConfigUtil.setConfigItem('badgeOption', newValue);
				ipcRenderer.send('toggle-badge-option', newValue);
				this.updateBadgeOption();
			}
		});
	}

	updateFlashTaskbar() {
		this.generateSettingOption({
			$element: document.querySelector('#flash-taskbar-option .setting-control'),
			value: ConfigUtil.getConfigItem('flashTaskbarOnMessage', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('flashTaskbarOnMessage');
				ConfigUtil.setConfigItem('flashTaskbarOnMessage', newValue);
				this.updateFlashTaskbar();
			}
		});
	}

	updateUpdateOption() {
		this.generateSettingOption({
			$element: document.querySelector('#betaupdate-option .setting-control'),
			value: ConfigUtil.getConfigItem('betaUpdate', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('betaUpdate');
				ConfigUtil.setConfigItem('betaUpdate', newValue);
				this.updateUpdateOption();
			}
		});
	}

	updateSilentOption() {
		this.generateSettingOption({
			$element: document.querySelector('#silent-option .setting-control'),
			value: ConfigUtil.getConfigItem('silent', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('silent', true);
				ConfigUtil.setConfigItem('silent', newValue);
				this.updateSilentOption();
			}
		});
	}

	showDesktopNotification() {
		this.generateSettingOption({
			$element: document.querySelector('#show-notification-option .setting-control'),
			value: ConfigUtil.getConfigItem('showNotification', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('showNotification', true);
				ConfigUtil.setConfigItem('showNotification', newValue);
				this.showDesktopNotification();
			}
		});
	}

	updateSidebarOption() {
		this.generateSettingOption({
			$element: document.querySelector('#sidebar-option .setting-control'),
			value: ConfigUtil.getConfigItem('showSidebar', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('showSidebar');
				ConfigUtil.setConfigItem('showSidebar', newValue);
				ipcRenderer.send('forward-message', 'toggle-sidebar', newValue);
				this.updateSidebarOption();
			}
		});
	}

	updateStartAtLoginOption() {
		this.generateSettingOption({
			$element: document.querySelector('#startAtLogin-option .setting-control'),
			value: ConfigUtil.getConfigItem('startAtLogin', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('startAtLogin');
				ConfigUtil.setConfigItem('startAtLogin', newValue);
				ipcRenderer.send('toggleAutoLauncher', newValue);
				this.updateStartAtLoginOption();
			}
		});
	}

	enableSpellchecker() {
		this.generateSettingOption({
			$element: document.querySelector('#enable-spellchecker-option .setting-control'),
			value: ConfigUtil.getConfigItem('enableSpellchecker', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('enableSpellchecker');
				ConfigUtil.setConfigItem('enableSpellchecker', newValue);
				this.enableSpellchecker();
			}
		});
	}

	clearAppDataDialog() {
		const clearAppDataMessage = 'By clicking proceed you will be removing all added accounts and preferences from Zulip. When the application restarts, it will be as if you are starting Zulip for the first time.';
		const getAppPath = path.join(app.getPath('appData'), app.getName());

		dialog.showMessageBox({
			type: 'warning',
			buttons: ['YES', 'NO'],
			defaultId: 0,
			message: 'Are you sure',
			detail: clearAppDataMessage
		}, response => {
			if (response === 0) {
				fs.remove(getAppPath);
				setTimeout(() => ipcRenderer.send('forward-message', 'hard-reload'), 1000);
			}
		});
	}

	updateResetDataOption() {
		const resetDataButton = document.querySelector('#resetdata-option .reset-data-button');
		resetDataButton.addEventListener('click', () => {
			this.clearAppDataDialog();
		});
	}

}

module.exports = GeneralSection;
