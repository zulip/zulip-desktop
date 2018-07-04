'use strict';
const path = require('path');

const { app, shell, BrowserWindow, Menu, dialog } = require('electron');

const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const { appUpdater } = require('./autoupdater');

const ConfigUtil = require(__dirname + '/../renderer/js/utils/config-util.js');
const DNDUtil = require(__dirname + '/../renderer/js/utils/dnd-util.js');
const Logger = require(__dirname + '/../renderer/js/utils/logger-util.js');

const appName = app.getName();

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

class AppMenu {
	getHistorySubmenu() {
		return [{
			label: 'Back',
			accelerator: process.platform === 'darwin' ? 'Command+Left' : 'Alt+Left',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('back');
				}
			}
		}, {
			label: 'Forward',
			accelerator: process.platform === 'darwin' ? 'Command+Right' : 'Alt+Right',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('forward');
				}
			}
		}];
	}

	getViewSubmenu() {
		return [{
			label: 'Reload',
			accelerator: 'CommandOrControl+R',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('reload-current-viewer');
				}
			}
		}, {
			label: 'Hard Reload',
			accelerator: 'CommandOrControl+Shift+R',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('hard-reload');
				}
			}
		}, {
			type: 'separator'
		}, {
			role: 'togglefullscreen'
		}, {
			label: 'Zoom In',
			accelerator: process.platform === 'darwin' ? 'Command+Plus' : 'Control+=',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomIn');
				}
			}
		}, {
			label: 'Zoom Out',
			accelerator: 'CommandOrControl+-',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomOut');
				}
			}
		}, {
			label: 'Actual Size',
			accelerator: 'CommandOrControl+0',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomActualSize');
				}
			}
		}, {
			type: 'separator'
		}, {
			label: 'Toggle Tray Icon',
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.webContents.send('toggletray');
				}
			}
		}, {
			label: 'Toggle Sidebar',
			accelerator: 'CommandOrControl+Shift+S',
			click(item, focusedWindow) {
				if (focusedWindow) {
					const newValue = !ConfigUtil.getConfigItem('showSidebar');
					focusedWindow.webContents.send('toggle-sidebar', newValue);
					ConfigUtil.setConfigItem('showSidebar', newValue);
				}
			}
		}, {
			label: 'Toggle DevTools for Zulip App',
			accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.webContents.toggleDevTools();
				}
			}
		}, {
			label: 'Toggle DevTools for Active Tab',
			accelerator: process.platform === 'darwin' ? 'Alt+Command+U' : 'Ctrl+Shift+U',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('tab-devtools');
				}
			}
		}];
	}

	getHelpSubmenu() {
		return [
			{
				label: `${appName + ' Desktop-'} v${app.getVersion()}`,
				enabled: false
			},
			{
				label: `What's New...`,
				click() {
					shell.openExternal(`https://github.com/zulip/zulip-electron/releases/tag/v${app.getVersion()}`);
				}
			},
			{
				label: `${appName} Help`,
				click() {
					shell.openExternal('https://zulipchat.com/help/');
				}
			}, {
				label: 'Show App Logs',
				click() {
					const zip = new AdmZip();
					let date = new Date();
					date = date.toLocaleDateString().replace(/\//g, '-');

					// Create a zip file of all the logs and config data
					zip.addLocalFolder(`${app.getPath('appData')}/${appName}/Logs`);
					zip.addLocalFolder(`${app.getPath('appData')}/${appName}/config`);

					// Put the log file in downloads folder
					const logFilePath = `${app.getPath('downloads')}/Zulip-logs-${date}.zip`;
					zip.writeZip(logFilePath);

					// Open and select the log file
					shell.showItemInFolder(logFilePath);
				}
			}, {
				label: 'Report an Issue...',
				click() {
					// the goal is to notify the main.html BrowserWindow
					// which may not be the focused window.
					BrowserWindow.getAllWindows().forEach(window => {
						window.webContents.send('open-feedback-modal');
					});
				}
			}];
	}

	getWindowSubmenu(tabs, activeTabIndex) {
		const initialSubmenu = [{
			role: 'minimize'
		}, {
			role: 'close'
		}];

		if (tabs.length > 0) {
			const ShortcutKey = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';
			initialSubmenu.push({
				type: 'separator'
			});
			for (let i = 0; i < tabs.length; i++) {
				// Do not add functional tab settings to list of windows in menu bar
				if (tabs[i].props.role === 'function' && tabs[i].webview.props.name === 'Settings') {
					continue;
				}

				initialSubmenu.push({
					label: tabs[i].webview.props.name,
					accelerator: tabs[i].props.role === 'function' ? '' : `${ShortcutKey} + ${tabs[i].props.index + 1}`,
					checked: tabs[i].props.index === activeTabIndex,
					click(item, focusedWindow) {
						if (focusedWindow) {
							AppMenu.sendAction('switch-server-tab', tabs[i].props.index);
						}
					},
					type: 'checkbox'
				});
			}
		}

		return initialSubmenu;
	}

	getDarwinTpl(props) {
		const { tabs, activeTabIndex } = props;

		return [{
			label: `${app.getName()}`,
			submenu: [{
				label: 'About Zulip',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-about');
					}
				}
			}, {
				label: `Check for Update`,
				click() {
					AppMenu.checkForUpdate();
				}
			}, {
				type: 'separator'
			}, {
				label: 'Desktop App Settings',
				accelerator: 'Cmd+,',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-settings');
					}
				}
			}, {
				label: 'Keyboard Shortcuts',
				accelerator: 'Cmd+Shift+K',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('shortcut');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: 'Toggle Do Not Disturb',
				accelerator: 'Command+Shift+M',
				click() {
					const dndUtil = DNDUtil.toggle();
					AppMenu.sendAction('toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
				}
			}, {
				label: 'Reset App Settings',
				accelerator: 'Command+Shift+D',
				click() {
					AppMenu.resetAppSettings();
				}
			}, {
				label: 'Log Out',
				accelerator: 'Cmd+L',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('log-out');
					}
				}
			}, {
				type: 'separator'
			}, {
				role: 'services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				role: 'hide'
			}, {
				role: 'hideothers'
			}, {
				role: 'unhide'
			}, {
				type: 'separator'
			}, {
				role: 'quit'
			}]
		}, {
			label: 'Edit',
			submenu: [{
				role: 'undo'
			}, {
				role: 'redo'
			}, {
				type: 'separator'
			}, {
				role: 'cut'
			}, {
				role: 'copy'
			}, {
				role: 'paste'
			}, {
				role: 'pasteandmatchstyle'
			}, {
				role: 'delete'
			}, {
				role: 'selectall'
			}]
		}, {
			label: 'View',
			submenu: this.getViewSubmenu()
		}, {
			label: 'History',
			submenu: this.getHistorySubmenu()
		}, {
			label: 'Window',
			submenu: this.getWindowSubmenu(tabs, activeTabIndex)
		}, {
			role: 'help',
			submenu: this.getHelpSubmenu()
		}];
	}

	getOtherTpl(props) {
		const { tabs, activeTabIndex } = props;

		return [{
			label: 'File',
			submenu: [{
				label: 'About Zulip',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-about');
					}
				}
			}, {
				label: `Check for Update`,
				click() {
					AppMenu.checkForUpdate();
				}
			}, {
				type: 'separator'
			}, {
				label: 'Desktop App Settings',
				accelerator: 'Ctrl+,',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-settings');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: 'Keyboard Shortcuts',
				accelerator: 'Ctrl+Shift+K',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('shortcut');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: 'Toggle Do Not Disturb',
				accelerator: 'Ctrl+Shift+M',
				click() {
					const dndUtil = DNDUtil.toggle();
					AppMenu.sendAction('toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
				}
			}, {
				label: 'Reset App Settings',
				accelerator: 'Ctrl+Shift+D',
				click() {
					AppMenu.resetAppSettings();
				}
			}, {
				label: 'Log Out',
				accelerator: 'Ctrl+L',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('log-out');
					}
				}
			}, {
				type: 'separator'
			}, {
				role: 'quit',
				accelerator: 'Ctrl+Q'
			}]
		}, {
			label: 'Edit',
			submenu: [{
				role: 'undo'
			}, {
				role: 'redo'
			}, {
				type: 'separator'
			}, {
				role: 'cut'
			}, {
				role: 'copy'
			}, {
				role: 'paste'
			}, {
				role: 'pasteandmatchstyle'
			}, {
				role: 'delete'
			}, {
				type: 'separator'
			}, {
				role: 'selectall'
			}]
		}, {
			label: 'View',
			submenu: this.getViewSubmenu()
		}, {
			label: 'History',
			submenu: this.getHistorySubmenu()
		}, {
			label: 'Window',
			submenu: this.getWindowSubmenu(tabs, activeTabIndex)
		}, {
			role: 'help',
			submenu: this.getHelpSubmenu()
		}];
	}

	static sendAction(action, ...params) {
		const win = BrowserWindow.getAllWindows()[0];

		if (process.platform === 'darwin') {
			win.restore();
		}

		win.webContents.send(action, ...params);
	}

	static checkForUpdate() {
		appUpdater(true);
	}
	static resetAppSettings() {
		const resetAppSettingsMessage = 'By proceeding you will be removing all connected organizations and preferences from Zulip.';

		// We save App's settings/configurations in following files
		const settingFiles = ['config/window-state.json', 'config/domain.json', 'config/settings.json', 'config/certificates.json'];

		dialog.showMessageBox({
			type: 'warning',
			buttons: ['YES', 'NO'],
			defaultId: 0,
			message: 'Are you sure?',
			detail: resetAppSettingsMessage
		}, response => {
			if (response === 0) {
				settingFiles.forEach(settingFileName => {
					const getSettingFilesPath = path.join(app.getPath('appData'), appName, settingFileName);
					fs.access(getSettingFilesPath, error => {
						if (error) {
							logger.error('Error while resetting app settings.');
							logger.error(error);
						} else {
							fs.unlink(getSettingFilesPath, () => {
								AppMenu.sendAction('clear-app-data');
							});
						}
					});
				});
			}
		});
	}

	setMenu(props) {
		const tpl = process.platform === 'darwin' ? this.getDarwinTpl(props) : this.getOtherTpl(props);
		const menu = Menu.buildFromTemplate(tpl);
		Menu.setApplicationMenu(menu);
	}
}

module.exports = new AppMenu();
