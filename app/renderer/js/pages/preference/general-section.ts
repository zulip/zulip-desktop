'use strict';
import { ipcRenderer, remote, OpenDialogOptions } from 'electron';

import path = require('path');
import fs = require('fs-extra');

const { app, dialog } = remote;
const currentBrowserWindow = remote.getCurrentWindow();

import BaseSection = require('./base-section');
import ConfigUtil = require('../../utils/config-util');

class GeneralSection extends BaseSection {
	// TODO: TypeScript - Here props should be object type
	props: any;
	constructor(props: any) {
		super();
		this.props = props;
	}

	template(): string {
		return `
            <div class="settings-pane">
                <div class="title">Appearance</div>
                <div id="appearance-option-settings" class="settings-card">
					<div class="setting-row" id="tray-option">
						<div class="setting-description">Show app icon in system tray</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="menubar-option" style= "display:${process.platform === 'darwin' ? 'none' : ''}">
						<div class="setting-description">Auto hide menu bar (Press Alt key to display)</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="sidebar-option">
						<div class="setting-description">Show sidebar (<span class="code">${process.platform === 'darwin' ? 'Cmd+Shift+S' : 'Ctrl+Shift+S'}</span>)</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="badge-option">
						<div class="setting-description">Show app unread badge</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="dock-bounce-option" style= "display:${process.platform === 'darwin' ? '' : 'none'}">
						<div class="setting-description">Bounce dock on new private message</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="flash-taskbar-option" style= "display:${process.platform === 'win32' ? '' : 'none'}">
						<div class="setting-description">Flash taskbar on new message</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">Desktop Notifications</div>
				<div class="settings-card">
					<div class="setting-row" id="show-notification-option">
						<div class="setting-description">Show desktop notifications</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="silent-option">
						<div class="setting-description">Mute all sounds from Zulip</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">App Updates</div>
				<div class="settings-card">
				<div class="setting-row" id="autoupdate-option">
						<div class="setting-description">Enable auto updates</div>
						<div class="setting-control"></div>
					</div>
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
					<div class="setting-row" id="start-minimize-option">
						<div class="setting-description">Always start minimized</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="enable-spellchecker-option">
						<div class="setting-description">Enable spellchecker (requires restart)</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">Advanced</div>
				<div class="settings-card">
				<div class="setting-row" id="enable-error-reporting">
					<div class="setting-description">Enable error reporting (requires restart)</div>
					<div class="setting-control"></div>
				</div>
				<div class="setting-row" id="show-download-folder">
					<div class="setting-description">Show downloaded files in file manager</div>
					<div class="setting-control"></div>
				</div>
				<div class="setting-row" id="add-custom-css">
				<div class="setting-description">
					Add custom CSS
				</div>
				<button class="custom-css-button green">Upload</button>
			</div>
			<div class="setting-row" id="remove-custom-css">
				<div class="setting-description">
					<div class="selected-css-path" id="custom-css-path">${ConfigUtil.getConfigItem('customCSS')}</div>
				</div>
				<div class="action red" id="css-delete-action">
					<i class="material-icons">indeterminate_check_box</i>
					<span>Delete</span>
				</div>
			</div>
					<div class="setting-row" id="download-folder">
						<div class="setting-description">
							Default download location
						</div>
						<button class="download-folder-button green">Change</button>
					</div>
					<div class="setting-row">
						<div class="setting-description">
							<div class="download-folder-path">${ConfigUtil.getConfigItem('downloadsPath', `${app.getPath('downloads')}`)}</div>
						</div>
					</div>

				</div>
				<div class="title">Reset Application Data</div>
                <div class="settings-card">
					<div class="setting-row" id="resetdata-option">
						<div class="setting-description">This will delete all application data including all added accounts and preferences
						</div>
						<button class="reset-data-button red w-150">Reset App Data</button>
					</div>
				</div>
            </div>
		`;
	}

	init(): void {
		this.props.$root.innerHTML = this.template();
		this.updateTrayOption();
		this.updateBadgeOption();
		this.updateSilentOption();
		this.autoUpdateOption();
		this.betaUpdateOption();
		this.updateSidebarOption();
		this.updateStartAtLoginOption();
		this.updateResetDataOption();
		this.showDesktopNotification();
		this.enableSpellchecker();
		this.minimizeOnStart();
		this.addCustomCSS();
		this.showCustomCSSPath();
		this.removeCustomCSS();
		this.downloadFolder();
		this.showDownloadFolder();
		this.enableErrorReporting();

		// Platform specific settings

		// Flashing taskbar on Windows
		if (process.platform === 'win32') {
			this.updateFlashTaskbar();
		}
		// Dock bounce on macOS
		if (process.platform === 'darwin') {
			this.updateDockBouncing();
		}

		// Auto hide menubar on Windows and Linux
		if (process.platform !== 'darwin') {
			this.updateMenubarOption();
		}
	}

	updateTrayOption(): void {
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

	updateMenubarOption(): void {
		this.generateSettingOption({
			$element: document.querySelector('#menubar-option .setting-control'),
			value: ConfigUtil.getConfigItem('autoHideMenubar', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('autoHideMenubar');
				ConfigUtil.setConfigItem('autoHideMenubar', newValue);
				ipcRenderer.send('toggle-menubar', newValue);
				this.updateMenubarOption();
			}
		});
	}

	updateBadgeOption(): void {
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

	updateDockBouncing(): void {
		this.generateSettingOption({
			$element: document.querySelector('#dock-bounce-option .setting-control'),
			value: ConfigUtil.getConfigItem('dockBouncing', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('dockBouncing');
				ConfigUtil.setConfigItem('dockBouncing', newValue);
				this.updateDockBouncing();
			}
		});
	}

	updateFlashTaskbar(): void {
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

	autoUpdateOption(): void {
		this.generateSettingOption({
			$element: document.querySelector('#autoupdate-option .setting-control'),
			value: ConfigUtil.getConfigItem('autoUpdate', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('autoUpdate');
				ConfigUtil.setConfigItem('autoUpdate', newValue);
				if (!newValue) {
					ConfigUtil.setConfigItem('betaUpdate', false);
					this.betaUpdateOption();
				}
				this.autoUpdateOption();
			}
		});
	}

	betaUpdateOption(): void {
		this.generateSettingOption({
			$element: document.querySelector('#betaupdate-option .setting-control'),
			value: ConfigUtil.getConfigItem('betaUpdate', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('betaUpdate');
				if (ConfigUtil.getConfigItem('autoUpdate')) {
					ConfigUtil.setConfigItem('betaUpdate', newValue);
					this.betaUpdateOption();
				}
			}
		});
	}

	updateSilentOption(): void {
		this.generateSettingOption({
			$element: document.querySelector('#silent-option .setting-control'),
			value: ConfigUtil.getConfigItem('silent', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('silent', true);
				ConfigUtil.setConfigItem('silent', newValue);
				this.updateSilentOption();
				// TODO: TypeScript: currentWindow of type BrowserWindow doesn't
				// have a .send() property per typescript.
				(currentBrowserWindow as any).send('toggle-silent', newValue);
			}
		});
	}

	showDesktopNotification(): void {
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

	updateSidebarOption(): void {
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

	updateStartAtLoginOption(): void {
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

	enableSpellchecker(): void {
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

	enableErrorReporting(): void {
		this.generateSettingOption({
			$element: document.querySelector('#enable-error-reporting .setting-control'),
			value: ConfigUtil.getConfigItem('errorReporting', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('errorReporting');
				ConfigUtil.setConfigItem('errorReporting', newValue);
				this.enableErrorReporting();
			}
		});
	}

	clearAppDataDialog(): void {
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

	customCssDialog(): void {
		const showDialogOptions: OpenDialogOptions = {
			title: 'Select file',
			properties: ['openFile'],
			filters: [{ name: 'CSS file', extensions: ['css'] }]
		};

		dialog.showOpenDialog(showDialogOptions, selectedFile => {
			if (selectedFile) {
				ConfigUtil.setConfigItem('customCSS', selectedFile[0]);
				ipcRenderer.send('forward-message', 'hard-reload');
			}
		});
	}

	updateResetDataOption(): void {
		const resetDataButton = document.querySelector('#resetdata-option .reset-data-button');
		resetDataButton.addEventListener('click', () => {
			this.clearAppDataDialog();
		});
	}

	minimizeOnStart(): void {
		this.generateSettingOption({
			$element: document.querySelector('#start-minimize-option .setting-control'),
			value: ConfigUtil.getConfigItem('startMinimized', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('startMinimized');
				ConfigUtil.setConfigItem('startMinimized', newValue);
				this.minimizeOnStart();
			}
		});
	}

	addCustomCSS(): void {
		const customCSSButton = document.querySelector('#add-custom-css .custom-css-button');
		customCSSButton.addEventListener('click', () => {
			this.customCssDialog();
		});
	}

	showCustomCSSPath(): void {
		if (!ConfigUtil.getConfigItem('customCSS')) {
			const cssPATH: HTMLElement = document.querySelector('#remove-custom-css');
			cssPATH.style.display = 'none';
		}
	}

	removeCustomCSS(): void {
		const removeCSSButton = document.querySelector('#css-delete-action');
		removeCSSButton.addEventListener('click', () => {
			ConfigUtil.setConfigItem('customCSS', "");
			ipcRenderer.send('forward-message', 'hard-reload');
		});
	}

	downloadFolderDialog(): void {
		const showDialogOptions: OpenDialogOptions = {
			title: 'Select Download Location',
			properties: ['openDirectory']
		};

		dialog.showOpenDialog(showDialogOptions, selectedFolder => {
			if (selectedFolder) {
				ConfigUtil.setConfigItem('downloadsPath', selectedFolder[0]);
				const downloadFolderPath: HTMLElement = document.querySelector('.download-folder-path');
				downloadFolderPath.innerText = selectedFolder[0];
			}
		});
	}
	downloadFolder(): void {
		const downloadFolder = document.querySelector('#download-folder .download-folder-button');
		downloadFolder.addEventListener('click', () => {
			this.downloadFolderDialog();
		});
	}

	showDownloadFolder(): void {
		this.generateSettingOption({
			$element: document.querySelector('#show-download-folder .setting-control'),
			value: ConfigUtil.getConfigItem('showDownloadFolder', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('showDownloadFolder');
				ConfigUtil.setConfigItem('showDownloadFolder', newValue);
				this.showDownloadFolder();
			}
		});
	}
}

export = GeneralSection;
