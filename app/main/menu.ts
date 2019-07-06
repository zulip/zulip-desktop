'use strict';
import { app, shell, BrowserWindow, Menu, dialog } from 'electron';
import { appUpdater } from './autoupdater';

import AdmZip = require('adm-zip');
import fs = require('fs-extra');
import path = require('path');
import DNDUtil = require('../renderer/js/utils/dnd-util');
import Logger = require('../renderer/js/utils/logger-util');
import ConfigUtil = require('../renderer/js/utils/config-util');
import t = require('../renderer/js/utils/translation-util');

const appName = app.getName();

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

class AppMenu {
	getHistorySubmenu(enableMenu: boolean): Electron.MenuItemConstructorOptions[] {
		return [{
			label: t.__('Back'),
			accelerator: process.platform === 'darwin' ? 'Command+Left' : 'Alt+Left',
			enabled: enableMenu,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('back');
				}
			}
		}, {
			label: t.__('Forward'),
			accelerator: process.platform === 'darwin' ? 'Command+Right' : 'Alt+Right',
			enabled: enableMenu,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('forward');
				}
			}
		}];
	}

	getToolsSubmenu(): Electron.MenuItemConstructorOptions[] {
		return [{
			label: t.__(`Check for Updates`),
			click() {
				AppMenu.checkForUpdate();
			}
		},
		{
			label: t.__(`Release Notes`),
			click() {
				shell.openExternal(`https://github.com/zulip/zulip-desktop/releases/tag/v${app.getVersion()}`);
			}
		},
		{
			type: 'separator'
		},
		{
			label: t.__('Factory Reset'),
			accelerator: process.platform === 'darwin' ? 'Command+Shift+D' : 'Ctrl+Shift+D',
			click() {
				AppMenu.resetAppSettings();
			}
		},
		{
			label: t.__('Download App Logs'),
			click() {
				const zip = new AdmZip();
				const date = new Date();
				const dateString = date.toLocaleDateString().replace(/\//g, '-');

				// Create a zip file of all the logs and config data
				zip.addLocalFolder(`${app.getPath('appData')}/${appName}/Logs`);
				zip.addLocalFolder(`${app.getPath('appData')}/${appName}/config`);

				// Put the log file in downloads folder
				const logFilePath = `${app.getPath('downloads')}/Zulip-logs-${dateString}.zip`;
				zip.writeZip(logFilePath);

				// Open and select the log file
				shell.showItemInFolder(logFilePath);
			}
		},
		{
			type: 'separator'
		},
		{
			label: t.__('Toggle DevTools for Zulip App'),
			accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					focusedWindow.webContents.openDevTools({mode: 'undocked'});
				}
			}
		},
		{
			label: t.__('Toggle DevTools for Active Tab'),
			accelerator: process.platform === 'darwin' ? 'Alt+Command+U' : 'Ctrl+Shift+U',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('tab-devtools');
				}
			}
		}];
	}

	getViewSubmenu(): Electron.MenuItemConstructorOptions[] {
		return [{
			label: t.__('Reload'),
			accelerator: 'CommandOrControl+R',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('reload-current-viewer');
				}
			}
		}, {
			label: t.__('Hard Reload'),
			accelerator: 'CommandOrControl+Shift+R',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('hard-reload');
				}
			}
		}, {
			type: 'separator'
		}, {
			label: t.__('Toggle Full Screen'),
			role: 'togglefullscreen'
		}, {
			label: t.__('Zoom In'),
			role: 'zoomin',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomIn');
				}
			}
		}, {
			label: t.__('Zoom Out'),
			accelerator: 'CommandOrControl+-',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomOut');
				}
			}
		}, {
			label: t.__('Actual Size'),
			accelerator: 'CommandOrControl+0',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomActualSize');
				}
			}
		}, {
			type: 'separator'
		}, {
			label: t.__('Toggle Tray Icon'),
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					focusedWindow.webContents.send('toggletray');
				}
			}
		}, {
			label: t.__('Toggle Sidebar'),
			accelerator: 'CommandOrControl+Shift+S',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					const newValue = !ConfigUtil.getConfigItem('showSidebar');
					focusedWindow.webContents.send('toggle-sidebar', newValue);
					ConfigUtil.setConfigItem('showSidebar', newValue);
				}
			}
		}, {
			label: t.__('Auto hide Menu bar'),
			checked: ConfigUtil.getConfigItem('autoHideMenubar', false),
			visible: process.platform !== 'darwin',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					const newValue = !ConfigUtil.getConfigItem('autoHideMenubar');
					focusedWindow.setAutoHideMenuBar(newValue);
					focusedWindow.setMenuBarVisibility(!newValue);
					focusedWindow.webContents.send('toggle-autohide-menubar', newValue);
					ConfigUtil.setConfigItem('autoHideMenubar', newValue);
				}
			},
			type: 'checkbox'
		}];
	}

	getHelpSubmenu(): Electron.MenuItemConstructorOptions[] {
		return [
			{
				label: `${appName + ' Desktop'} v${app.getVersion()}`,
				enabled: false
			},
			{
				label: t.__('About Zulip'),
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('open-about');
					}
				}
			},
			{
				label: t.__(`Help Center`),
				click(focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-help');
					}
				}
			},
			{
				label: t.__('Report an Issue'),
				click() {
					// the goal is to notify the main.html BrowserWindow
					// which may not be the focused window.
					BrowserWindow.getAllWindows().forEach(window => {
						window.webContents.send('open-feedback-modal');
					});
				}
			}
		];
	}

	getWindowSubmenu(tabs: any[], activeTabIndex: number, enableMenu: boolean): Electron.MenuItemConstructorOptions[] {
		const initialSubmenu: any[] = [{
			label: t.__('Minimize'),
			role: 'minimize'
		}, {
			label: t.__('Close'),
			role: 'close'
		}];

		if (tabs.length > 0) {
			const ShortcutKey = process.platform === 'darwin' ? 'Cmd' : 'Ctrl';
			initialSubmenu.push({
				type: 'separator'
			});
			tabs.forEach(tab => {
				// Do not add functional tab settings to list of windows in menu bar
				if (tab.props.role === 'function' && tab.props.name === 'Settings') {
					return;
				}

				initialSubmenu.push({
					label: tab.props.name,
					accelerator: tab.props.role === 'function' ? '' : `${ShortcutKey} + ${tab.props.index + 1}`,
					checked: tab.props.index === activeTabIndex,
					click(_item: any, focusedWindow: any) {
						if (focusedWindow) {
							AppMenu.sendAction('switch-server-tab', tab.props.index);
						}
					},
					type: 'checkbox'
				});
			});
			initialSubmenu.push({
				type: 'separator'
			});
			initialSubmenu.push({
				label: t.__('Switch to Next Organization'),
				accelerator: `Ctrl+Tab`,
				enabled: tabs.length > 1,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('switch-server-tab', AppMenu.getNextServer(tabs, activeTabIndex));
					}
				}
			}, {
				label: t.__('Switch to Previous Organization'),
				accelerator: `Ctrl+Shift+Tab`,
				enabled: tabs.length > 1,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('switch-server-tab', AppMenu.getPreviousServer(tabs, activeTabIndex));
					}
				}
			});
		}

		return initialSubmenu;
	}

	getDarwinTpl(props: any): Electron.MenuItemConstructorOptions[] {
		const { tabs, activeTabIndex, enableMenu } = props;

		return [{
			label: `${app.getName()}`,
			submenu: [{
				label: t.__('Add Organization'),
				accelerator: 'Cmd+Shift+N',
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('new-server');
					}
				}
			}, {
				label: t.__('Toggle Do Not Disturb'),
				accelerator: 'Cmd+Shift+M',
				click() {
					const dndUtil = DNDUtil.toggle();
					AppMenu.sendAction('toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
				}
			}, {
				label: t.__('Desktop Settings'),
				accelerator: 'Cmd+,',
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('open-settings');
					}
				}
			}, {
				label: t.__('Keyboard Shortcuts'),
				accelerator: 'Cmd+Shift+K',
				enabled: enableMenu,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('shortcut');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: t.__('Copy Zulip URL'),
				accelerator: 'Cmd+Shift+C',
				enabled: enableMenu,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('copy-zulip-url');
					}
				}
			}, {
				label: t.__('Log Out of Organization'),
				accelerator: 'Cmd+L',
				enabled: enableMenu,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('log-out');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: t.__('Services'),
				role: 'services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				label: t.__('Hide'),
				role: 'hide'
			}, {
				label: t.__('Hide Others'),
				role: 'hideothers'
			}, {
				label: t.__('Unhide'),
				role: 'unhide'
			}, {
				type: 'separator'
			}, {
				label: t.__('Minimize'),
				role: 'minimize'
			}, {
				label: t.__('Close'),
				role: 'close'
			}, {
				label: t.__('Quit'),
				role: 'quit'
			}]
		}, {
			label: t.__('Edit'),
			submenu: [{
				label: t.__('Undo'),
				role: 'undo'
			}, {
				label: t.__('Redo'),
				role: 'redo'
			}, {
				type: 'separator'
			}, {
				label: t.__('Cut'),
				role: 'cut'
			}, {
				label: t.__('Copy'),
				role: 'copy'
			}, {
				label: t.__('Paste'),
				role: 'paste'
			}, {
				label: t.__('Paste and Match Style'),
				role: 'pasteandmatchstyle'
			}, {
				label: t.__('Select All'),
				role: 'selectall'
			}]
		}, {
			label: t.__('View'),
			submenu: this.getViewSubmenu()
		}, {
			label: t.__('History'),
			submenu: this.getHistorySubmenu(enableMenu)
		}, {
			label: t.__('Window'),
			submenu: this.getWindowSubmenu(tabs, activeTabIndex, enableMenu)
		}, {
			label: t.__('Tools'),
			submenu: this.getToolsSubmenu()
		}, {
			label: t.__('Help'),
			role: 'help',
			submenu: this.getHelpSubmenu()
		}];
	}

	getOtherTpl(props: any): Electron.MenuItemConstructorOptions[] {
		const { tabs, activeTabIndex, enableMenu } = props;
		return [{
			label: t.__('File'),
			submenu: [{
				label: t.__('Add Organization'),
				accelerator: 'Ctrl+Shift+N',
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('new-server');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: t.__('Toggle Do Not Disturb'),
				accelerator: 'Ctrl+Shift+M',
				click() {
					const dndUtil = DNDUtil.toggle();
					AppMenu.sendAction('toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
				}
			}, {
				label: t.__('Desktop Settings'),
				accelerator: 'Ctrl+,',
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('open-settings');
					}
				}
			}, {
				label: t.__('Keyboard Shortcuts'),
				accelerator: 'Ctrl+Shift+K',
				enabled: enableMenu,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('shortcut');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: t.__('Copy Zulip URL'),
				accelerator: 'Ctrl+Shift+C',
				enabled: enableMenu,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('copy-zulip-url');
					}
				}
			}, {
				label: t.__('Log Out of Organization'),
				accelerator: 'Ctrl+L',
				enabled: enableMenu,
				click(_item: any, focusedWindow: any) {
					if (focusedWindow) {
						AppMenu.sendAction('log-out');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: t.__('Minimize'),
				role: 'minimize'
			}, {
				label: t.__('Close'),
				role: 'close'
			}, {
				label: t.__('Quit'),
				role: 'quit',
				accelerator: 'Ctrl+Q'
			}]
		}, {
			label: t.__('Edit'),
			submenu: [{
				label: t.__('Undo'),
				role: 'undo'
			}, {
				label: t.__('Redo'),
				role: 'redo'
			}, {
				type: 'separator'
			}, {
				label: t.__('Cut'),
				role: 'cut'
			}, {
				label: t.__('Copy'),
				role: 'copy'
			}, {
				label: t.__('Paste'),
				role: 'paste'
			}, {
				label: t.__('Paste and Match Style'),
				role: 'pasteandmatchstyle'
			}, {
				type: 'separator'
			}, {
				label: t.__('Select All'),
				role: 'selectall'
			}]
		}, {
			label: t.__('View'),
			submenu: this.getViewSubmenu()
		}, {
			label: t.__('History'),
			submenu: this.getHistorySubmenu(enableMenu)
		}, {
			label: t.__('Window'),
			submenu: this.getWindowSubmenu(tabs, activeTabIndex, enableMenu)
		}, {
			label: t.__('Tools'),
			submenu: this.getToolsSubmenu()
		}, {
			label: t.__('Help'),
			role: 'help',
			submenu: this.getHelpSubmenu()
		}];
	}

	static sendAction(action: any, ...params: any[]): void {
		const win = BrowserWindow.getAllWindows()[0];

		if (process.platform === 'darwin') {
			win.restore();
		}

		win.webContents.send(action, ...params);
	}

	static checkForUpdate(): void {
		appUpdater(true);
	}

	static getNextServer(tabs: any[], activeTabIndex: number): number {
		do {
			activeTabIndex = (activeTabIndex + 1) % tabs.length;
		}
		while (tabs[activeTabIndex].props.role !== 'server');
		return activeTabIndex;
	}

	static getPreviousServer(tabs: any[], activeTabIndex: number): number {
		do {
			activeTabIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
		}
		while (tabs[activeTabIndex].props.role !== 'server');
		return activeTabIndex;
	}

	static resetAppSettings(): void {
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
					fs.access(getSettingFilesPath, (error: any) => {
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

	setMenu(props: any): void {
		const tpl = process.platform === 'darwin' ? this.getDarwinTpl(props) : this.getOtherTpl(props);
		const menu = Menu.buildFromTemplate(tpl);
		Menu.setApplicationMenu(menu);
	}
}

export = new AppMenu();
