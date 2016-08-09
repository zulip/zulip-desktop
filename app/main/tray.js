'use strict';
const path = require('path');
const electron = require('electron');
const app = require('electron').app;
const {shell} = require('electron');
const { addDomain, About } = require('./windowmanager');
const BrowserWindow = electron.BrowserWindow;

let tray = null;

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
  return process.platform === 'win32'
    ? APP_ICON + '.ico'
    : APP_ICON + '.png'
};

exports.create = win => {

	// Noone is using this feature. so let's hide it for now.
	// const toggleWin = () => {
	// 	if (win.isVisible()) {
	// 		win.hide();
	// 	} else {
	// 		win.show();
	// 	}
	// };
	
	const contextMenu = electron.Menu.buildFromTemplate([
		{
			label: 'About',
			click() {
				About();
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Change Zulip server',
			click(item, focusedWindow) {
				if(focusedWindow) addDomain();
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Reload',
			click (item, focusedWindow) {
			  if (focusedWindow) focusedWindow.reload()
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

