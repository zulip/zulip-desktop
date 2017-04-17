'use strict';
const path = require('path');
const electron = require('electron');
const app = require('electron').app;
const {addDomain, about} = require('./windowmanager');

let tray = null;
let unread = 0;

const APP_ICON = path.join(__dirname, '../resources/tray', 'tray');

const iconPath = () => {
	if (process.platform === 'linux') {
		return APP_ICON + 'linux.png';
	}
	return APP_ICON + (process.platform === 'win32' ? 'win.ico' : 'osx.png');
};

app.on('web-contents-created', (e, wb) => {
	setInterval(() => {
		// If to handle error if wb is destroyed before 7 seconds
		if (wb !== null) {
			// If to handle error if wb is destroyed before entering this block happens generally during switching server
			if (!wb.isDestroyed()) {
				wb.executeJavaScript('document.querySelector("#streams_header")', res => {
					// If to handle error if wb is destroyed before entering this block and res to check it's a zulip chat web page
					if (res !== null && wb !== null) {
						wb.executeJavaScript('document.querySelector(".value").innerText', result => {
							// If to check if value class has no innerHTML
							if (result.length > 0) {
								unread = result;
							} else {
								unread = 0;
							}
						});
					}
				});
			}
		}
	}, 500); // setInterval updates unread every 0.5 seconds
});

const createHandler = () => {
	const contextMenu = electron.Menu.buildFromTemplate([{
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
	// tray.setToolTip(`${app.getName()}`);
	setInterval(() => {
		if (unread > 0) {
			tray.setToolTip(unread + ' unread messages');
		} else {
			tray.setToolTip('No unread messages');
		}
	}, 500); // updates tooltip every 0.5 second
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
