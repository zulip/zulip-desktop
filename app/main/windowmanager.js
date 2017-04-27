'use strict';
const path = require('path');
const electron = require('electron');
const ipc = require('electron').ipcMain;

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.png');
};
let domainWindow;
let aboutWindow;

function onClosed() {
	// Dereference the window
	domainWindow = null;
	aboutWindow = null;
}

// Change Zulip server Window
function createdomainWindow() {
	const domainwin = new electron.BrowserWindow({
		title: 'Switch Server',
		frame: false,
		height: 300,
		resizable: false,
		width: 400,
		show: false,
		icon: iconPath()

	});
	const domainURL = 'file://' + path.join(__dirname, '../renderer', 'pref.html');
	domainwin.loadURL(domainURL);
	domainwin.on('closed', onClosed);

	return domainwin;
}
// Call this window onClick addDomain in tray
function addDomain() {
	domainWindow = createdomainWindow();
	domainWindow.once('ready-to-show', () => {
		domainWindow.show();
	});
	setTimeout(() => {
		if (domainWindow !== null) {
			if (!domainWindow.isDestroyed()) {
				domainWindow.destroy();
			}
		}
	}, 15000);
}
// About window
function createAboutWindow() {
	const aboutwin = new electron.BrowserWindow({
		width: 500,
		height: 500,
		title: 'About Zulip Desktop',
		show: false,
		center: true,
		fullscreen: false,
		fullscreenable: false,
		resizable: false
	});
	const aboutURL = 'file://' + path.join(__dirname, '../renderer', 'about.html');
	aboutwin.loadURL(aboutURL);
	aboutwin.on('closed', onClosed);

	// Stop page to update it's title
	aboutwin.on('page-title-updated', e => {
		e.preventDefault();
	});

	aboutwin.on('closed', onClosed);

	return aboutwin;
}

// Call this onClick About in tray
function about() {
	aboutWindow = createAboutWindow();
	aboutWindow.once('ready-to-show', () => {
		aboutWindow.show();
	});
}

ipc.on('trayabout', event => {
	if (event) {
		about();
	}
});

module.exports = {
	addDomain,
	about
};
