'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const electron = require('electron');
const {app} = require('electron');
const ipc = require('electron').ipcMain;
const {dialog} = require('electron');
const https = require('https');
const http = require('http');
const electronLocalshortcut = require('electron-localshortcut');
const Configstore = require('electron-config');
const JsonDB = require('node-json-db');
const isDev = require('electron-is-dev');
const appMenu = require('./menu');
const {linkIsInternal, skipImages} = require('./link-helper');
const {appUpdater} = require('./autoupdater');

const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
const data = db.getData('/');

// Adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

const conf = new Configstore();

function userOS() {
	if (os.platform() === 'darwin') {
		return 'Mac';
	}
	if (os.platform() === 'linux') {
		return 'Linux';
	}
	if (os.platform() === 'win32' || os.platform() === 'win64') {
		if (parseFloat(os.release()) < 6.2) {
			return 'Windows 7';
		} else {
			return 'Windows 10';
		}
	}
}

// Setting userAgent so that server-side code can identify the desktop app
const isUserAgent = 'ZulipElectron/' + app.getVersion() + ' ' + userOS();

// Prevent window being garbage collected
let mainWindow;
let targetLink;

// Load this url in main window
const staticURL = 'file://' + path.join(__dirname, '../renderer', 'index.html');

const targetURL = function () {
	if (data.domain === undefined) {
		return staticURL;
	}
	return data.domain;
};

function serverError(targetURL) {
	if (targetURL.indexOf('localhost:') < 0 && data.domain) {
		const req = https.request(targetURL + '/static/audio/zulip.ogg', res => {
			console.log('Server StatusCode:', res.statusCode);
			console.log('You are connected to:', res.req._headers.host);
			if (res.statusCode >= 500 && res.statusCode <= 599) {
				return dialog.showErrorBox('SERVER IS DOWN!', 'We are getting a ' + res.statusCode + ' error status from the server ' + res.req._headers.host + '. Please try again after some time or you may switch server.');
			}
		});
		req.on('error', e => {
			console.error(e);
		});
		req.end();
	} else if (data.domain) {
		const req = http.request(targetURL + '/static/audio/zulip.ogg', res => {
			console.log('Server StatusCode:', res.statusCode);
			console.log('You are connected to:', res.req._headers.host);
		});
		req.on('error', e => {
			console.error(e);
		});
		req.end();
	}
}

function checkConnectivity() {
	return dialog.showMessageBox({
		title: 'Internet connection problem',
		message: 'No internet available! Try again?',
		type: 'warning',
		buttons: ['Try again', 'Close'],
		defaultId: 0
	}, index => {
		if (index === 0) {
			mainWindow.webContents.reload();
			mainWindow.webContents.send('destroytray');
		}
		if (index === 1) {
			app.quit();
		}
	});
}

function checkConnection() {
	// eslint-disable-next-line no-unused-vars
	mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
		if (errorDescription === 'ERR_INTERNET_DISCONNECTED' || errorDescription === 'ERR_PROXY_CONNECTION_FAILED') {
			console.log('Error Description:' + errorDescription);
			checkConnectivity();
		}
	});
}

const isAlreadyRunning = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

if (isAlreadyRunning) {
	app.quit();
}

function checkWindowURL() {
	if (data.domain !== undefined) {
		return data.domain;
	}
	return targetLink;
}

function isWindowsOrmacOS() {
	return process.platform === 'darwin' || process.platform === 'win32';
}

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.png');
};

function onClosed() {
	// Dereference the window
	// For multiple windows, store them in an array
	mainWindow = null;
}

function updateDockBadge(title) {
	if (title.indexOf('Zulip') === -1) {
		return;
	}

	let messageCount = (/\(([0-9]+)\)/).exec(title);
	messageCount = messageCount ? Number(messageCount[1]) : 0;

	if (process.platform === 'darwin') {
		app.setBadgeCount(messageCount);
	}
	mainWindow.webContents.send('tray', messageCount);
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		// This settings needs to be saved in config
		title: 'Zulip',
		width: conf.get('width') || 1000,
		height: conf.get('height') || 600,
		icon: iconPath(),
		minWidth: 600,
		minHeight: 400,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			plugins: true,
			allowDisplayingInsecureContent: true,
			nodeIntegration: false
		},
		show: false
	});

	win.once('ready-to-show', () => {
		win.show();
	});

	serverError(targetURL());

	win.loadURL(targetURL(), {
		userAgent: isUserAgent + ' ' + win.webContents.getUserAgent()
	});

	win.on('closed', onClosed);
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

	// Stop page to update it's title
	win.on('page-title-updated', (e, title) => {
		e.preventDefault();
		updateDockBadge(title);
	});

         //  To destroy tray icon when navigate to a new URL
	win.webContents.on('will-navigate', e => {
		if (e) {
			win.webContents.send('destroytray');
		}
	});

	return win;
}

// TODO - fix certificate errors
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

app.on('window-all-closed', () => {
	// Unregister all the shortcuts so that they don't interfare with other apps
	electronLocalshortcut.unregisterAll(mainWindow);
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	electron.Menu.setApplicationMenu(appMenu);
	mainWindow = createMainWindow();
	// Not using for now // tray.create();

	const page = mainWindow.webContents;

	// TODO - use global shortcut instead
	electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
		mainWindow.reload();
		mainWindow.webContents.send('destroytray');
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+[', () => {
		if (page.canGoBack()) {
			page.goBack();
		}
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+]', () => {
		if (page.canGoForward()) {
			page.goForward();
		}
	});

	page.on('dom-ready', () => {
		page.insertCSS(fs.readFileSync(path.join(__dirname, 'preload.css'), 'utf8'));
		mainWindow.show();
	});

	page.on('new-window', (event, url) => {
		if (linkIsInternal(checkWindowURL(), url) && url.match(skipImages) === null) {
			event.preventDefault();
			return mainWindow.loadURL(url);
		}
		event.preventDefault();
		electron.shell.openExternal(url);
	});

	page.once('did-frame-finish-load', () => {
		const checkOS = isWindowsOrmacOS();
		if (checkOS && !isDev) {
			// Initate auto-updates on MacOS and Windows
			appUpdater();
		}
	});
	checkConnection();
});

app.on('will-quit', () => {
	// Unregister all the shortcuts so that they don't interfare with other apps
	electronLocalshortcut.unregisterAll(mainWindow);
});

ipc.on('new-domain', (e, domain) => {
	// MainWindow.loadURL(domain);
	if (!mainWindow) {
		mainWindow = createMainWindow();
		mainWindow.loadURL(domain);
		mainWindow.webContents.send('destroytray');
	} else if (mainWindow.isMinimized()) {
		mainWindow.webContents.send('destroytray');
		mainWindow.loadURL(domain);
		mainWindow.show();
	} else {
		mainWindow.webContents.send('destroytray');
		mainWindow.loadURL(domain);
		serverError(domain);
	}
	targetLink = domain;
});
