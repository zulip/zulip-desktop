'use strict';
const path = require('path');
const electron = require('electron');
const app = require('electron').app;
const {shell} = require('electron');
const about = require ('./about');
const domain = require ('./domain');
const { createAboutWindow, onClosed } = about;
const { createdomainWindow } = domain;

let tray = null;
let aboutWindow;
let domainWindow;

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

	const reload = () => {
		win.reload();
	};

	const About = () => {
		aboutWindow = createAboutWindow();
		aboutWindow.show();
	};

	const addDomain = () => {
		domainWindow = createdomainWindow();
		domainWindow.show();
	};

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
			click() {
				addDomain();
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Reload',
			click() {
				reload();
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

