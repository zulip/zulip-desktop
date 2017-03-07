'use strict';
const path = require('path');
const electron = require('electron');
const app = require('electron').app;
const {addDomain, about} = require('./windowmanager');

let tray = null;

const APP_ICON = path.join(__dirname, '../resources/tray', 'tray');

const iconPath = () => {
	if (process.platform === 'linux') {
		return APP_ICON + 'linux.png';
	}
	return APP_ICON + (process.platform === 'win32' ? 'win.ico' : 'osx.png');
};

const createHandler = () => {
	const contextMenu = electron.Menu.buildFromTemplate([
		{
			label: 'About',
			click() {
				about();
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Change Zulip server',
			click() {
				addDomain();
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Reload',
			click(item, focusedWindow) {
				if (focusedWindow) {
					focusedWindow.reload();
				}
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Quit',
			click() {
				app.quit();
			}
		}
	]);

	tray = new electron.Tray(iconPath());
	tray.setToolTip(`${app.getName()}`);
	tray.setContextMenu(contextMenu);
};

const destroyHandler = () => {
	tray.destroy();
	if (tray.isDestroyed()) {
		tray = null;
	} else {
		throw new Error('Tray icon not properly destroyed.');
	}
};

const toggleHandler = () => {
	if (tray) {
		destroyHandler();
	} else {
		createHandler();
	}
};

exports.create = createHandler;
exports.destroy = destroyHandler;
exports.toggle = toggleHandler;
