'use strict';
const path = require('path');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const windowStateKeeper = require('electron-window-state');
const appMenu = require('./menu');
const { appUpdater } = require('./autoupdater');
const { crashHandler } = require('./crash-reporter');

const { setAutoLaunch } = require('./startup');

const { app, ipcMain } = electron;

const BadgeSettings = require('./../renderer/js/pages/preference/badge-settings.js');

// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// Prevent window being garbage collected
let mainWindow;
let badgeCount;

let isQuitting = false;

// Load this url in main window
const mainURL = 'file://' + path.join(__dirname, '../renderer', 'main.html');

const isAlreadyRunning = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

if (isAlreadyRunning) {
	return app.quit();
}

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.png');
};

function createMainWindow() {
	// Load the previous state with fallback to defaults
	const mainWindowState = windowStateKeeper({
		defaultWidth: 1000,
		defaultHeight: 600
	});

	// Let's keep the window position global so that we can access it in other process
	global.mainWindowState = mainWindowState;

	const win = new electron.BrowserWindow({
		// This settings needs to be saved in config
		title: 'Zulip',
		icon: iconPath(),
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 600,
		minHeight: 500,
		webPreferences: {
			plugins: true,
			allowDisplayingInsecureContent: true,
			nodeIntegration: true
		},
		show: false
	});

	win.on('focus', () => {
		win.webContents.send('focus');
	});

	win.once('ready-to-show', () => {
		win.show();
	});

	win.loadURL(mainURL);

	// Keep the app running in background on close event
	win.on('close', e => {
		if (!isQuitting) {
			e.preventDefault();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				win.hide();
			}
		}

		// Unregister all the shortcuts so that they don't interfare with other apps
		electronLocalshortcut.unregisterAll(mainWindow);
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

function registerLocalShortcuts(page) {
	// Somehow, reload action cannot be overwritten by the menu item
	electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
		page.send('reload-current-viewer');
	});

	// Also adding these shortcuts because some users might want to use it instead of CMD/Left-Right
	electronLocalshortcut.register(mainWindow, 'CommandOrControl+[', () => {
		page.send('back');
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+]', () => {
		page.send('forward');
	});
}

// eslint-disable-next-line max-params
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
	event.preventDefault();
	callback(true);
});

app.on('window-all-closed', () => {
	// Unregister all the shortcuts so that they don't interfare with other apps
	electronLocalshortcut.unregisterAll(mainWindow);
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	appMenu.setMenu({
		tabs: []
	});
	mainWindow = createMainWindow();

	const page = mainWindow.webContents;

	registerLocalShortcuts(page);

	page.on('dom-ready', () => {
		mainWindow.show();
	});

	page.once('did-frame-finish-load', () => {
		// Initate auto-updates on MacOS and Windows
		appUpdater();
		crashHandler();
	});

	electron.powerMonitor.on('resume', () => {
		page.send('reload-viewer');
	});

	ipcMain.on('focus-app', () => {
		mainWindow.show();
	});

	ipcMain.on('quit-app', () => {
		app.quit();
	});

	// Reload full app not just webview, useful in debugging
	ipcMain.on('reload-full-app', () => {
		mainWindow.reload();
		page.send('destroytray');
	});

	ipcMain.on('clear-app-settings', () => {
		global.mainWindowState.unmanage(mainWindow);
		app.relaunch();
		app.exit();
	});

	ipcMain.on('toggle-app', () => {
		if (mainWindow.isVisible()) {
			mainWindow.hide();
		} else {
			mainWindow.show();
		}
	});

	ipcMain.on('toggle-badge-option', () => {
		BadgeSettings.updateBadge(badgeCount, mainWindow);
	});

	ipcMain.on('update-badge', (event, messageCount) => {
		badgeCount = messageCount;
		BadgeSettings.updateBadge(badgeCount, mainWindow);
		page.send('tray', messageCount);
	});

	ipcMain.on('update-taskbar-icon', (event, data, text) => {
		BadgeSettings.updateTaskbarIcon(data, text, mainWindow);
	});

	ipcMain.on('forward-message', (event, listener, ...params) => {
		page.send(listener, ...params);
	});

	ipcMain.on('update-menu', (event, props) => {
		appMenu.setMenu(props);
	});

	ipcMain.on('register-server-tab-shortcut', (event, index) => {
		electronLocalshortcut.register(mainWindow, `CommandOrControl+${index}`, () => {
			// Array index == Shown index - 1
			page.send('switch-server-tab', index - 1);
		});
	});

	ipcMain.on('local-shortcuts', (event, enable) => {
		if (enable) {
			registerLocalShortcuts(page);
		} else {
			electronLocalshortcut.unregisterAll(mainWindow);
		}
	});

	ipcMain.on('toggleAutoLauncher', (event, AutoLaunchValue) => {
		setAutoLaunch(AutoLaunchValue);
	});
});

app.on('will-quit', () => {
	// Unregister all the shortcuts so that they don't interfare with other apps
	electronLocalshortcut.unregisterAll(mainWindow);
});

app.on('before-quit', () => {
	isQuitting = true;
});

// Send crash reports
process.on('uncaughtException', err => {
	console.error(err);
	console.error(err.stack);
});
