'use strict';
const os = require('os');
const path = require('path');

const { app, shell, BrowserWindow, Menu } = require('electron');

const fs = require('fs-extra');

const ConfigUtil = require(__dirname + '/../renderer/js/utils/config-util.js');

const appName = app.getName();

const i18n = require(__dirname + '/../translations/i18n');

class AppMenu {
	getHistorySubmenu() {
		return [{
			label: i18n._('Back'),
			accelerator: process.platform === 'darwin' ? 'Command+Left' : 'Alt+Left',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('back');
				}
			}
		}, {
			label: i18n._('Forward'),
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
			label: i18n._('Reload'),
			accelerator: 'CommandOrControl+R',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('reload-current-viewer');
				}
			}
		}, {
			label: i18n._('Hard Reload'),
			accelerator: 'CommandOrControl+Shift+R',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('hard-reload');
				}
			}
		}, {
			type: 'separator'
		}, {
			label: i18n._('Toggle Full Screen'),
			role: 'togglefullscreen'
		}, {
			label: i18n._('Zoom In'),
			accelerator: process.platform === 'darwin' ? 'Command+Plus' : 'Control+=',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomIn');
				}
			}
		}, {
			label: i18n._('Zoom Out'),
			accelerator: 'CommandOrControl+-',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomOut');
				}
			}
		}, {
			label: i18n._('Actual Size'),
			accelerator: 'CommandOrControl+0',
			click(item, focusedWindow) {
				if (focusedWindow) {
					AppMenu.sendAction('zoomActualSize');
				}
			}
		}, {
			type: 'separator'
		}, {
			label: i18n._('Toggle Tray Icon'),
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.webContents.send('toggletray');
				}
			}
		}, {
			label: i18n._('Toggle Sidebar'),
			accelerator: 'CommandOrControl+S',
			click(item, focusedWindow) {
				if (focusedWindow) {
					const newValue = !ConfigUtil.getConfigItem('showSidebar');
					focusedWindow.webContents.send('toggle-sidebar', newValue);
					ConfigUtil.setConfigItem('showSidebar', newValue);
				}
			}
		}, {
			label: i18n._('Toggle DevTools for Zulip App'),
			accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.webContents.toggleDevTools();
				}
			}
		}, {
			label: i18n._('Toggle DevTools for Active Tab'),
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
				label: i18n._(`${appName} Help`),
				click() {
					shell.openExternal('https://zulipchat.com/help/');
				}
			}, {
				label: i18n._('Show App Logs'),
				click() {
					shell.openItem(app.getPath('userData'));
				}
			}, {
				label: i18n._('Report an issue...'),
				click() {
					const body = `
					<!-- Please succinctly describe your issue and steps to reproduce it. -->
					-
					${app.getName()} ${app.getVersion()}
					Electron ${process.versions.electron}
					${process.platform} ${process.arch} ${os.release()}`;
					shell.openExternal(`https://github.com/zulip/zulip-electron/issues/new?body=${encodeURIComponent(body)}`);
				}
			}];
	}

	getWindowSubmenu(tabs, activeTabIndex) {
		const initialSubmenu = [{
			label: i18n._('Minimize'),
			role: 'minimize'
		}, {
			label: i18n._('Close'),
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
				label: i18n._('About Zulip'),
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-about');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: i18n._('Desktop App Settings'),
				accelerator: 'Cmd+,',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-settings');
					}
				}
			}, {
				label: i18n._('Keyboard Shortcuts'),
				accelerator: 'Cmd+Shift+K',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('shortcut');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: i18n._('Reset App Settings'),
				accelerator: 'Command+Shift+D',
				click() {
					AppMenu.resetAppSettings();
				}
			}, {
				label: i18n._('Log Out'),
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
				label: i18n._('Quit'),
				role: 'quit'
			}]
		}, {
			label: i18n._('Edit'),
			submenu: [{
				role: 'undo', label: i18n._('Undo')
			}, {
				role: 'redo', label: i18n._('Redo')
			}, {
				type: 'separator'
			}, {
				role: 'cut', label: i18n._('Cut')
			}, {
				role: 'copy', label: i18n._('Copy')
			}, {
				role: 'paste', label: i18n._('Paste')
			}, {
				role: 'pasteandmatchstyle', label: i18n._('Paste and Match Style')
			}, {
				role: 'delete', label: i18n._('Delete')
			}, {
				type: 'separator'
			}, {
				role: 'selectall', label: i18n._('Select All')
			}]
		}, {
			label: i18n._('View'),
			submenu: this.getViewSubmenu()
		}, {
			label: i18n._('History'),
			submenu: this.getHistorySubmenu()
		}, {
			label: i18n._('Window'),
			submenu: this.getWindowSubmenu(tabs, activeTabIndex)
		}, {
			label: i18n._('Help'),
			role: 'help',
			submenu: this.getHelpSubmenu()
		}];
	}

	getOtherTpl(props) {
		const { tabs, activeTabIndex } = props;

		return [{
			label: i18n._('File'),
			submenu: [{
				label: i18n._('About Zulip'),
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-about');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: i18n._('Desktop App Settings'),
				accelerator: 'Ctrl+,',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('open-settings');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: i18n._('Keyboard Shortcuts'),
				accelerator: 'Ctrl+Shift+K',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('shortcut');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: i18n._('Reset App Settings'),
				accelerator: 'Ctrl+Shift+D',
				click() {
					AppMenu.resetAppSettings();
				}
			}, {
				label: i18n._('Log Out'),
				accelerator: 'Ctrl+L',
				click(item, focusedWindow) {
					if (focusedWindow) {
						AppMenu.sendAction('log-out');
					}
				}
			}, {
				type: 'separator'
			}, {
				label: i18n._('Quit'),
				role: 'quit',
				accelerator: 'Ctrl+Q'
			}]
		}, {
			label: i18n._('Edit'),
			submenu: [{
				role: 'undo', label: i18n._('Undo')
			}, {
				role: 'redo', label: i18n._('Redo')
			}, {
				type: 'separator'
			}, {
				role: 'cut', label: i18n._('Cut')
			}, {
				role: 'copy', label: i18n._('Copy')
			}, {
				role: 'paste', label: i18n._('Paste')
			}, {
				role: 'pasteandmatchstyle', label: i18n._('Paste and Match Style')
			}, {
				role: 'delete', label: i18n._('Delete')
			}, {
				type: 'separator'
			}, {
				role: 'selectall', label: i18n._('Select All')
			}]
		}, {
			label: i18n._('View'),
			submenu: this.getViewSubmenu()
		}, {
			label: i18n._('History'),
			submenu: this.getHistorySubmenu()
		}, {
			label: i18n._('Window'),
			submenu: this.getWindowSubmenu(tabs, activeTabIndex)
		}, {
			label: i18n._('Help'),
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

	static resetAppSettings() {
		// We save App's settings/configurations in following files
		const settingFiles = ['window-state.json', 'domain.json', 'settings.json'];

		settingFiles.forEach(settingFileName => {
			const getSettingFilesPath = path.join(app.getPath('appData'), appName, settingFileName);
			fs.access(getSettingFilesPath, error => {
				if (error) {
					console.log(error);
				} else {
					fs.unlink(getSettingFilesPath, () => {
						AppMenu.sendAction('clear-app-data');
					});
				}
			});
		});
	}

	setMenu(props) {
		const tpl = process.platform === 'darwin' ? this.getDarwinTpl(props) : this.getOtherTpl(props);
		const menu = Menu.buildFromTemplate(tpl);
		Menu.setApplicationMenu(menu);
	}
}

module.exports = new AppMenu();
