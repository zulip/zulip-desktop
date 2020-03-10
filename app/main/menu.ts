import { app, shell, BrowserWindow, Menu, dialog } from 'electron';
import { appUpdater } from './autoupdater';

import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import * as DNDUtil from '../renderer/js/utils/dnd-util';
import Logger from '../renderer/js/utils/logger-util';
import * as ConfigUtil from '../renderer/js/utils/config-util';
import * as t from '../renderer/js/utils/translation-util';

const appName = app.name;

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

function getHistorySubmenu(enableMenu: boolean): Electron.MenuItemConstructorOptions[] {
	return [{
		label: t.__('Back'),
		accelerator: process.platform === 'darwin' ? 'Command+Left' : 'Alt+Left',
		enabled: enableMenu,
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('back');
			}
		}
	}, {
		label: t.__('Forward'),
		accelerator: process.platform === 'darwin' ? 'Command+Right' : 'Alt+Right',
		enabled: enableMenu,
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('forward');
			}
		}
	}];
}

function getToolsSubmenu(): Electron.MenuItemConstructorOptions[] {
	return [{
		label: t.__('Check for Updates'),
		click() {
			checkForUpdate();
		}
	},
	{
		label: t.__('Release Notes'),
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
			resetAppSettings();
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
				sendAction('tab-devtools');
			}
		}
	}];
}

function getViewSubmenu(): Electron.MenuItemConstructorOptions[] {
	return [{
		label: t.__('Reload'),
		accelerator: 'CommandOrControl+R',
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('reload-current-viewer');
			}
		}
	}, {
		label: t.__('Hard Reload'),
		accelerator: 'CommandOrControl+Shift+R',
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('hard-reload');
			}
		}
	}, {
		type: 'separator'
	}, {
		label: t.__('Toggle Full Screen'),
		role: 'togglefullscreen'
	}, {
		label: t.__('Zoom In'),
		role: 'zoomIn',
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('zoomIn');
			}
		}
	}, {
		label: t.__('Zoom Out'),
		role: 'zoomOut',
		accelerator: 'CommandOrControl+-',
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('zoomOut');
			}
		}
	}, {
		label: t.__('Actual Size'),
		role: 'resetZoom',
		accelerator: 'CommandOrControl+0',
		click(_item: any, focusedWindow: any) {
			if (focusedWindow) {
				sendAction('zoomActualSize');
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
				focusedWindow.autoHideMenuBar = newValue;
				focusedWindow.setMenuBarVisibility(!newValue);
				focusedWindow.webContents.send('toggle-autohide-menubar', newValue);
				ConfigUtil.setConfigItem('autoHideMenubar', newValue);
			}
		},
		type: 'checkbox'
	}];
}

function getHelpSubmenu(): Electron.MenuItemConstructorOptions[] {
	return [
		{
			label: `${appName + ' Desktop'} v${app.getVersion()}`,
			enabled: false
		},
		{
			label: t.__('About Zulip'),
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('open-about');
				}
			}
		},
		{
			label: t.__('Help Center'),
			click(focusedWindow) {
				if (focusedWindow) {
					sendAction('open-help');
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

function getWindowSubmenu(tabs: any[], activeTabIndex: number, enableMenu: boolean): Electron.MenuItemConstructorOptions[] {
	const initialSubmenu: Electron.MenuItemConstructorOptions[] = [{
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
						sendAction('switch-server-tab', tab.props.index);
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
			accelerator: 'Ctrl+Tab',
			enabled: tabs.length > 1,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('switch-server-tab', getNextServer(tabs, activeTabIndex));
				}
			}
		}, {
			label: t.__('Switch to Previous Organization'),
			accelerator: 'Ctrl+Shift+Tab',
			enabled: tabs.length > 1,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('switch-server-tab', getPreviousServer(tabs, activeTabIndex));
				}
			}
		});
	}

	return initialSubmenu;
}

function getDarwinTpl(props: any): Electron.MenuItemConstructorOptions[] {
	const { tabs, activeTabIndex, enableMenu } = props;

	return [{
		label: app.name,
		submenu: [{
			label: t.__('Add Organization'),
			accelerator: 'Cmd+Shift+N',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('new-server');
				}
			}
		}, {
			label: t.__('Toggle Do Not Disturb'),
			accelerator: 'Cmd+Shift+M',
			click() {
				const dndUtil = DNDUtil.toggle();
				sendAction('toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
			}
		}, {
			label: t.__('Desktop Settings'),
			accelerator: 'Cmd+,',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('open-settings');
				}
			}
		}, {
			label: t.__('Keyboard Shortcuts'),
			accelerator: 'Cmd+Shift+K',
			enabled: enableMenu,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('shortcut');
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
					sendAction('copy-zulip-url');
				}
			}
		}, {
			label: t.__('Log Out of Organization'),
			accelerator: 'Cmd+L',
			enabled: enableMenu,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('log-out');
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
			role: 'hideOthers'
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
			accelerator: 'Cmd+Z',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('undo');
				}
			}
		}, {
			label: t.__('Redo'),
			accelerator: 'Cmd+Shift+Z',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('redo');
				}
			}
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
			role: 'pasteAndMatchStyle'
		}, {
			label: t.__('Select All'),
			role: 'selectAll'
		}]
	}, {
		label: t.__('View'),
		submenu: getViewSubmenu()
	}, {
		label: t.__('History'),
		submenu: getHistorySubmenu(enableMenu)
	}, {
		label: t.__('Window'),
		submenu: getWindowSubmenu(tabs, activeTabIndex, enableMenu)
	}, {
		label: t.__('Tools'),
		submenu: getToolsSubmenu()
	}, {
		label: t.__('Help'),
		role: 'help',
		submenu: getHelpSubmenu()
	}];
}

function getOtherTpl(props: any): Electron.MenuItemConstructorOptions[] {
	const { tabs, activeTabIndex, enableMenu } = props;
	return [{
		label: t.__('File'),
		submenu: [{
			label: t.__('Add Organization'),
			accelerator: 'Ctrl+Shift+N',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('new-server');
				}
			}
		}, {
			type: 'separator'
		}, {
			label: t.__('Toggle Do Not Disturb'),
			accelerator: 'Ctrl+Shift+M',
			click() {
				const dndUtil = DNDUtil.toggle();
				sendAction('toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
			}
		}, {
			label: t.__('Desktop Settings'),
			accelerator: 'Ctrl+,',
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('open-settings');
				}
			}
		}, {
			label: t.__('Keyboard Shortcuts'),
			accelerator: 'Ctrl+Shift+K',
			enabled: enableMenu,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('shortcut');
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
					sendAction('copy-zulip-url');
				}
			}
		}, {
			label: t.__('Log Out of Organization'),
			accelerator: 'Ctrl+L',
			enabled: enableMenu,
			click(_item: any, focusedWindow: any) {
				if (focusedWindow) {
					sendAction('log-out');
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
			role: 'pasteAndMatchStyle'
		}, {
			type: 'separator'
		}, {
			label: t.__('Select All'),
			role: 'selectAll'
		}]
	}, {
		label: t.__('View'),
		submenu: getViewSubmenu()
	}, {
		label: t.__('History'),
		submenu: getHistorySubmenu(enableMenu)
	}, {
		label: t.__('Window'),
		submenu: getWindowSubmenu(tabs, activeTabIndex, enableMenu)
	}, {
		label: t.__('Tools'),
		submenu: getToolsSubmenu()
	}, {
		label: t.__('Help'),
		role: 'help',
		submenu: getHelpSubmenu()
	}];
}

function sendAction(action: string, ...params: any[]): void {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action, ...params);
}

function checkForUpdate(): void {
	appUpdater(true);
}

function getNextServer(tabs: any[], activeTabIndex: number): number {
	do {
		activeTabIndex = (activeTabIndex + 1) % tabs.length;
	}
	while (tabs[activeTabIndex].props.role !== 'server');
	return activeTabIndex;
}

function getPreviousServer(tabs: any[], activeTabIndex: number): number {
	do {
		activeTabIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
	}
	while (tabs[activeTabIndex].props.role !== 'server');
	return activeTabIndex;
}

async function resetAppSettings(): Promise<void> {
	const resetAppSettingsMessage = 'By proceeding you will be removing all connected organizations and preferences from Zulip.';

	// We save App's settings/configurations in following files
	const settingFiles = ['config/window-state.json', 'config/domain.json', 'config/settings.json', 'config/certificates.json'];

	const { response } = await dialog.showMessageBox({
		type: 'warning',
		buttons: ['YES', 'NO'],
		defaultId: 0,
		message: 'Are you sure?',
		detail: resetAppSettingsMessage
	});
	if (response === 0) {
		settingFiles.forEach(settingFileName => {
			const getSettingFilesPath = path.join(app.getPath('appData'), appName, settingFileName);
			fs.access(getSettingFilesPath, (error: any) => {
				if (error) {
					logger.error('Error while resetting app settings.');
					logger.error(error);
				} else {
					fs.unlink(getSettingFilesPath, () => {
						sendAction('clear-app-data');
					});
				}
			});
		});
	}
}

export function setMenu(props: any): void {
	const tpl = process.platform === 'darwin' ? getDarwinTpl(props) : getOtherTpl(props);
	const menu = Menu.buildFromTemplate(tpl);
	Menu.setApplicationMenu(menu);
}
