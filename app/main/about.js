'use strict';
const path = require('path');
const {BrowserWindow, ipcMain} = require('electron');

let aboutWindow;

function onClosed() {
	// Dereference the window
	domainWindow = null;
	aboutWindow = null;
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

ipcMain.on('trayabout', event => {
	if (event) {
		about();
	}
});

module.exports = {
	addDomain,
	about
};
