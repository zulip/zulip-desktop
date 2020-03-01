'use strict';
import { sentryInit } from '../renderer/js/utils/sentry-util';
import { appUpdater } from './autoupdater';
import { setAutoLaunch } from './startup';

import windowStateKeeper = require('electron-window-state');
import path = require('path');
import fs = require('fs');
import isDev = require('electron-is-dev');
import electron = require('electron');
const { app, ipcMain, session, dialog } = electron;

import AppMenu = require('./menu');
import BadgeSettings = require('../renderer/js/pages/preference/badge-settings');
import ConfigUtil = require('../renderer/js/utils/config-util');
import ProxyUtil = require('../renderer/js/utils/proxy-util');

interface PatchedGlobal extends NodeJS.Global {
	mainWindowState: windowStateKeeper.State;
}

const globalPatched = global as PatchedGlobal;

// Adds debug features like hotkeys for triggering dev tools and reload
// in development mode
if (isDev) {
	require('electron-debug')();
}

// Prevent window being garbage collected
let mainWindow: Electron.BrowserWindow;
let badgeCount: number;

let isQuitting = false;

// Load this url in main window
const mainURL = 'file://' + path.join(__dirname, '../renderer', 'main.html');

const singleInstanceLock = app.requestSingleInstanceLock();
if (singleInstanceLock) {
	app.on('second-instance', (event, argv) => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) {
				mainWindow.restore();
			}

			mainWindow.show();

			// URI scheme handler for systems other than macOS.
			// For macOS, see 'open-url' event below.
			if (process.platform !== 'darwin') {
				const deepLinkingUrl = argv.slice(1);
				handleDeepLink(deepLinkingUrl[(isDev && process.platform === 'win32') ? 1 : 0]);
			}
		}
	});
} else {
	app.quit();
}

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = (): string => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.png');
};

// toggle the app window
const toggleApp = (): any => {
	if (!mainWindow.isVisible() || mainWindow.isMinimized()) {
		mainWindow.show();
	} else {
		mainWindow.hide();
	}
};

function handleDeepLink(url: string): void {
	mainWindow.webContents.focus();
	mainWindow.webContents.send('deep-linking-url', url);
}

function createMainWindow(): Electron.BrowserWindow {
	// Load the previous state with fallback to defaults
	const mainWindowState: windowStateKeeper.State = windowStateKeeper({
		defaultWidth: 1100,
		defaultHeight: 720,
		path: `${app.getPath('userData')}/config`
	});

	// Let's keep the window position global so that we can access it in other process
	globalPatched.mainWindowState = mainWindowState;

	const win = new electron.BrowserWindow({
		// This settings needs to be saved in config
		title: 'Zulip',
		icon: iconPath(),
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 300,
		minHeight: 400,
		webPreferences: {
			plugins: true,
			nodeIntegration: true,
			partition: 'persist:webviewsession',
			webviewTag: true
		},
		show: false
	});

	win.on('focus', () => {
		win.webContents.send('focus');
	});

	win.loadURL(mainURL);

	// Keep the app running in background on close event
	win.on('close', e => {
		if (ConfigUtil.getConfigItem("quitOnClose")) {
			app.quit();
		}
		if (!isQuitting) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				win.hide();
			}
		}
	});

	win.setTitle('Zulip');

	win.on('enter-full-screen', () => {
		win.webContents.send('enter-fullscreen');
	});

	win.on('leave-full-screen', () => {
		win.webContents.send('leave-fullscreen');
	});

	//  To destroy tray icon when navigate to a new URL
	win.webContents.on('will-navigate', e => {
		if (e) {
			win.webContents.send('destroytray');
		}
	});

	// Let us register listeners on the window, so we can update the state
	// automatically (the listeners will be removed when the window is closed)
	// and restore the maximized or full screen state
	mainWindowState.manage(win);

	return win;
}

// Decrease load on GPU (experimental)
app.disableHardwareAcceleration();

if (process.platform === 'win32' && isDev) {
	app.setAsDefaultProtocolClient('zulip', process.execPath, [path.resolve(process.argv[1])]);
} else {
	app.setAsDefaultProtocolClient('zulip');
}

// URI scheme handler for macOS
app.on('open-url', (event, url) => {
	event.preventDefault();
	if (mainWindow) {
		mainWindow.webContents.send('deep-linking-url', url);
	}
});

// Temporary fix for Electron render colors differently
// More info here - https://github.com/electron/electron/issues/10732
app.commandLine.appendSwitch('force-color-profile', 'srgb');

// eslint-disable-next-line max-params
app.on('certificate-error', (event: Event, _webContents: Electron.WebContents, _url: string, _error: string, _certificate: any, callback) => {
	event.preventDefault();
	callback(true);
});

app.on('activate', () => {
	if (mainWindow) {
		// if there is already a window toggle the app
		toggleApp();
	} else {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	AppMenu.setMenu({
		tabs: []
	});
	mainWindow = createMainWindow();

	// Auto-hide menu bar on Windows + Linux
	if (process.platform !== 'darwin') {
		const shouldHideMenu = ConfigUtil.getConfigItem('autoHideMenubar') || false;
		mainWindow.autoHideMenuBar = shouldHideMenu;
		mainWindow.setMenuBarVisibility(!shouldHideMenu);
	}

	// Initialize sentry for main process
	const errorReporting = ConfigUtil.getConfigItem('errorReporting');
	if (errorReporting) {
		sentryInit();
	}

	const isSystemProxy = ConfigUtil.getConfigItem('useSystemProxy');

	if (isSystemProxy) {
		ProxyUtil.resolveSystemProxy(mainWindow);
	}

	const page = mainWindow.webContents;

	page.on('dom-ready', () => {
		if (ConfigUtil.getConfigItem('startMinimized')) {
			mainWindow.hide();
		} else {
			mainWindow.show();
		}
		if (!ConfigUtil.isConfigItemExists('userAgent')) {
			const userAgent = session.fromPartition('webview:persistsession').getUserAgent();
			ConfigUtil.setConfigItem('userAgent', userAgent);
		}
	});

	page.once('did-frame-finish-load', () => {
		// Initiate auto-updates on MacOS and Windows
		if (ConfigUtil.getConfigItem('autoUpdate')) {
			appUpdater();
		}
	});

	// Temporarily remove this event
	// electron.powerMonitor.on('resume', () => {
	// 	mainWindow.reload();
	// 	page.send('destroytray');
	// });

	ipcMain.on('focus-app', () => {
		mainWindow.show();
	});

	ipcMain.on('quit-app', () => {
		app.quit();
	});

	// Code to show pdf in a new BrowserWindow (currently commented out due to bug-upstream)
	// ipcMain.on('pdf-view', (event, url) => {
	// 	// Paddings for pdfWindow so that it fits into the main browserWindow
	// 	const paddingWidth = 55;
	// 	const paddingHeight = 22;

	// 	// Get the config of main browserWindow
	// 	const mainWindowState = global.mainWindowState;

	// 	// Window to view the pdf file
	// 	const pdfWindow = new electron.BrowserWindow({
	// 		x: mainWindowState.x + paddingWidth,
	// 		y: mainWindowState.y + paddingHeight,
	// 		width: mainWindowState.width - paddingWidth,
	// 		height: mainWindowState.height - paddingHeight,
	// 		webPreferences: {
	// 			plugins: true,
	// 			partition: 'persist:webviewsession'
	// 		}
	// 	});
	// 	pdfWindow.loadURL(url);

	// 	// We don't want to have the menu bar in pdf window
	// 	pdfWindow.setMenu(null);
	// });

	// Reload full app not just webview, useful in debugging
	ipcMain.on('reload-full-app', () => {
		mainWindow.reload();
		page.send('destroytray');
	});

	ipcMain.on('clear-app-settings', () => {
		globalPatched.mainWindowState.unmanage();
		app.relaunch();
		app.exit();
	});

	ipcMain.on('toggle-app', () => {
		toggleApp();
	});

	ipcMain.on('toggle-badge-option', () => {
		BadgeSettings.updateBadge(badgeCount, mainWindow);
	});

	ipcMain.on('toggle-menubar', (_event: Electron.IpcMainEvent, showMenubar: boolean) => {
		mainWindow.autoHideMenuBar = showMenubar;
		mainWindow.setMenuBarVisibility(!showMenubar);
		page.send('toggle-autohide-menubar', showMenubar, true);
	});

	ipcMain.on('update-badge', (_event: Electron.IpcMainEvent, messageCount: number) => {
		badgeCount = messageCount;
		BadgeSettings.updateBadge(badgeCount, mainWindow);
		page.send('tray', messageCount);
	});

	ipcMain.on('update-taskbar-icon', (_event: Electron.IpcMainEvent, data: any, text: string) => {
		BadgeSettings.updateTaskbarIcon(data, text, mainWindow);
	});

	ipcMain.on('forward-message', (_event: Electron.IpcMainEvent, listener: any, ...params: any[]) => {
		page.send(listener, ...params);
	});

	ipcMain.on('update-menu', (_event: Electron.IpcMainEvent, props: any) => {
		AppMenu.setMenu(props);
		const activeTab = props.tabs[props.activeTabIndex];
		if (activeTab) {
			mainWindow.setTitle(`Zulip - ${activeTab.webview.props.name}`);
		}
	});

	ipcMain.on('toggleAutoLauncher', (_event: Electron.IpcMainEvent, AutoLaunchValue: boolean) => {
		setAutoLaunch(AutoLaunchValue);
	});

	ipcMain.on('downloadFile', (_event: Electron.IpcMainEvent, url: string, downloadPath: string) => {
		page.downloadURL(url);
		page.session.once('will-download', async (_event: Event, item) => {
			let setFilePath: string;
			let shortFileName: string;
			if (ConfigUtil.getConfigItem('promptDownload', false)) {
				const showDialogOptions: object = {
					defaultPath: path.join(downloadPath, item.getFilename())
				};

				const result = await dialog.showSaveDialog(mainWindow, showDialogOptions);
				if (result.canceled) {
					item.cancel();
					return;
				}
				setFilePath = result.filePath;
				shortFileName = path.basename(setFilePath);
			} else {
				const getTimeStamp = (): any => {
					const date = new Date();
					return date.getTime();
				};

				const formatFile = (filePath: string): string => {
					const fileExtension = path.extname(filePath);
					const baseName = path.basename(filePath, fileExtension);
					return `${baseName}-${getTimeStamp()}${fileExtension}`;
				};

				const filePath = path.join(downloadPath, item.getFilename());

				// Update the name and path of the file if it already exists
				const updatedFilePath = path.join(downloadPath, formatFile(filePath));
				setFilePath = fs.existsSync(filePath) ? updatedFilePath : filePath;
				shortFileName = fs.existsSync(filePath) ? formatFile(filePath) : item.getFilename();
			}

			item.setSavePath(setFilePath);

			const updatedListener = (_event: Event, state: string): void => {
				switch (state) {
					case 'interrupted': {
						// Can interrupted to due to network error, cancel download then
						console.log('Download interrupted, cancelling and fallback to dialog download.');
						item.cancel();
						break;
					}
					case 'progressing': {
						if (item.isPaused()) {
							item.cancel();
						}
						// This event can also be used to show progress in percentage in future.
						break;
					}
					default: {
						console.info('Unknown updated state of download item');
					}
				}
			};
			item.on('updated', updatedListener);
			item.once('done', (_event: Event, state) => {
				if (state === 'completed') {
					page.send('downloadFileCompleted', item.getSavePath(), shortFileName);
				} else {
					console.log('Download failed state: ', state);
					page.send('downloadFileFailed');
				}
				// To stop item for listening to updated events of this file
				item.removeListener('updated', updatedListener);
			});
		});
	});

	ipcMain.on('realm-name-changed', (_event: Electron.IpcMainEvent, serverURL: string, realmName: string) => {
		page.send('update-realm-name', serverURL, realmName);
	});

	ipcMain.on('realm-icon-changed', (_event: Electron.IpcMainEvent, serverURL: string, iconURL: string) => {
		page.send('update-realm-icon', serverURL, iconURL);
	});

	// Using event.sender.send instead of page.send here to
	// make sure the value of errorReporting is sent only once on load.
	ipcMain.on('error-reporting', (event: Electron.IpcMainEvent) => {
		event.sender.send('error-reporting-val', errorReporting);
	});

	ipcMain.on('save-last-tab', (_event: Electron.IpcMainEvent, index: number) => {
		ConfigUtil.setConfigItem('lastActiveTab', index);
	});

	// Update user idle status for each realm after every 15s
	const idleCheckInterval = 15 * 1000; // 15 seconds
	setInterval(() => {
		// Set user idle if no activity in 1 second (idleThresholdSeconds)
		const idleThresholdSeconds = 1; // 1 second
		const idleState = electron.powerMonitor.getSystemIdleState(idleThresholdSeconds);
		if (idleState === 'active') {
			page.send('set-active');
		} else {
			page.send('set-idle');
		}
	}, idleCheckInterval);
});

app.on('before-quit', () => {
	isQuitting = true;
});

// Send crash reports
process.on('uncaughtException', err => {
	console.error(err);
	console.error(err.stack);
});
