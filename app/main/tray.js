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

const iconPath = path.join(__dirname, '../resources', 'Icon.png');

exports.create = win => {
	if (process.platform === 'darwin' || tray) {
		return;
	}

	const toggleWin = () => {
		if (win.isVisible()) {
			win.hide();
		} else {
			win.show();
		}
	};

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
			label: 'Change domain',
			click() {
				addDomain();
			}
		},
		{
			type: 'separator'
		},
		{
			label: 'Toggle',
			click() {
				toggleWin();
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

	tray = new electron.Tray(iconPath);
	tray.setToolTip(`${app.getName()}`);
	tray.setContextMenu(contextMenu);
	tray.on('click', toggleWin);
};