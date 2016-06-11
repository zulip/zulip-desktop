'use strict';
const path = require('path');
const electron = require('electron');
const app = electron.app;
const tray = require('./tray');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		// This settings needs to be saved in config
		title: 'Zulip',
		width: 1000,
		height: 600,
		icon: process.platform === 'linux' && path.join(__dirname, 'resources/Icon.png'),
		minWidth: 800,
		minHeight: 600,
		titleBarStyle: 'hidden-inset',
		autoHideMenuBar: true
	});

	win.loadURL('https://zulip.tabbott.net/login/');
	win.on('closed', onClosed);
	return win;
}

app.on('window-all-closed', () => {
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
	mainWindow = createMainWindow();
	tray.create(mainWindow);
});
