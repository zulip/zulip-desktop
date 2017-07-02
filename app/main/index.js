'use strict';
const path = require('path');
const electron = require('electron');
const {app} = require('electron');
const ipc = require('electron').ipcMain;
const electronLocalshortcut = require('electron-localshortcut');
const Configstore = require('electron-config');
const isDev = require('electron-is-dev');
const appMenu = require('./menu');
const {appUpdater} = require('./autoupdater');

// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const conf = new Configstore();

// Setting userAgent so that server-side code can identify the desktop app

// Prevent window being garbage collected
let mainWindow;

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

function isWindowsOrmacOS() {
	return process.platform === 'darwin' || process.platform === 'win32';
}

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.png');
};

function createMainWindow() {
	const win = new electron.BrowserWindow({
		// This settings needs to be saved in config
		title: 'Zulip',
		width: conf.get('width') || 1000,
		height: conf.get('height') || 600,
		icon: iconPath(),
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
	});

	win.setTitle('Zulip');

	// Let's save browser window position
	if (conf.get('x') || conf.get('y')) {
		win.setPosition(conf.get('x'), conf.get('y'));
	}

	if (conf.get('maximize')) {
		win.maximize();
	}

	// Handle sizing events so we can persist them.
	win.on('maximize', () => {
		conf.set('maximize', true);
	});

	win.on('unmaximize', () => {
		conf.set('maximize', false);
	});

	win.on('resize', function () {
		const size = this.getSize();
		conf.set({
			width: size[0],
			height: size[1]
		});
	});

	// On osx it's 'moved'
	win.on('move', function () {
		const pos = this.getPosition();
		conf.set({
			x: pos[0],
			y: pos[1]
		});
	});

	//  To destroy tray icon when navigate to a new URL
	win.webContents.on('will-navigate', e => {
		if (e) {
			win.webContents.send('destroytray');
		}
	});

	return win;
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
	electron.Menu.setApplicationMenu(appMenu);
	mainWindow = createMainWindow();

	const page = mainWindow.webContents;

	// TODO - use global shortcut instead
	electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
		// page.send('reload');
		mainWindow.reload();
		page.send('destroytray');
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+[', () => {
		page.send('back');
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+]', () => {
		page.send('forward');
	});

	page.on('dom-ready', () => {
		mainWindow.show();
	});

	page.once('did-frame-finish-load', () => {
		const checkOS = isWindowsOrmacOS();
		if (checkOS && !isDev) {
			// Initate auto-updates on MacOS and Windows
			appUpdater();
		}
	});
	electron.powerMonitor.on('resume', () => {
		mainWindow.reload();
		mainWindow.webContents.send('destroytray');
	});

	ipc.on('focus-app', () => {
		mainWindow.show();
	});

	ipc.on('quit-app', () => {
		app.quit();
	});

	ipc.on('reload-main', () => {
		page.reload();
	});

	ipc.on('toggle-app', () => {
		if (mainWindow.isVisible()) {
			mainWindow.hide();
		} else {
			mainWindow.show();
		}
	});

	ipc.on('update-badge', (event, messageCount) => {
		if (process.platform === 'darwin') {
			app.setBadgeCount(messageCount);
		}
		page.send('tray', messageCount);
	});

	ipc.on('forward', (event, listener) => {
		page.send(listener);
	});
});

app.on('will-quit', () => {
	// Unregister all the shortcuts so that they don't interfare with other apps
	electronLocalshortcut.unregisterAll(mainWindow);
});

app.on('before-quit', () => {
	isQuitting = true;
});
