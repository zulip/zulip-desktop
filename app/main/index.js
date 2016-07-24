'use strict';
const path = require('path');
const electron = require('electron');
const {app, shell} = require('electron');
const ipc = require('electron').ipcMain;

const tray = require('./tray');
const link = require ('./link_helper');
const {linkIsInternal} = link;

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();
require('electron-context-menu')();


// prevent window being garbage collected
let mainWindow;

// Load this url in main window
const targetUrl = 'file://' + path.join(__dirname, '../renderer', 'index.html');
let targetLink = data["domain"] || '';

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
  return process.platform === 'win32'
    ? APP_ICON + '.ico'
    : APP_ICON + '.png'
};


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
		icon: iconPath(),
		minWidth: 800,
		minHeight: 600
	});

	win.loadURL(targetUrl);
	win.on('closed', onClosed);
	win.setTitle('Zulip');

	// stop page to update it's title
	win.on('page-title-updated', (e) => {
	e.preventDefault();
	});

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

	const page = mainWindow.webContents;

    page.on('new-window', (event, url) => {
        if (mainWindow.useDefaultWindowBehaviour) {
            mainWindow.useDefaultWindowBehaviour = false;
            return;
        }
        if (linkIsInternal(targetLink, url)) {
        	event.preventDefault();
			return mainWindow.loadURL(url);
        }
        event.preventDefault();
        electron.shell.openExternal(url);
    });
});

ipc.on('new-domain', function (e, domain) {
	mainWindow.loadURL(domain);
	targetLink = domain;
});
