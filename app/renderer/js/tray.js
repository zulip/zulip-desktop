'use strict';
const path = require('path');

const electron = require('electron');

const {ipcRenderer, remote} = electron;

const {Tray, Menu, nativeImage, BrowserWindow} = remote;

const APP_ICON = path.join(__dirname, '../../resources/tray', 'tray');

const iconPath = () => {
	if (process.platform === 'linux') {
		return APP_ICON + 'linux.png';
	}
	return APP_ICON + (process.platform === 'win32' ? 'win.ico' : 'osx.png');
};

let unread = 0;

const trayIconSize = () => {
	switch (process.platform) {
		case 'darwin':
			return 20;
		case 'win32':
			return 100;
		case 'linux':
			return 100;
		default: return 80;
	}
};

//  Default config for Icon we might make it OS specific if needed like the size
const config = {
	pixelRatio: window.devicePixelRatio,
	unreadCount: 0,
	showUnreadCount: true,
	unreadColor: '#000000',
	readColor: '#000000',
	unreadBackgroundColor: '#B9FEEA',
	readBackgroundColor: '#B9FEEA',
	size: trayIconSize(),
	thick: process.platform === 'win32'
};

const renderCanvas = function (arg) {
	config.unreadCount = arg;
	return new Promise((resolve, reject) => {
		const SIZE = config.size * config.pixelRatio;
		const PADDING = SIZE * 0.05;
		const CENTER = SIZE / 2;
		const HAS_COUNT = config.showUnreadCount && config.unreadCount;
		const color = config.unreadCount ? config.unreadColor : config.readColor;
		const backgroundColor = config.unreadCount ? config.unreadBackgroundColor : config.readBackgroundColor;

		const canvas = document.createElement('canvas');
		canvas.width = SIZE;
		canvas.height = SIZE;
		const ctx = canvas.getContext('2d');

		// Circle
		// If (!config.thick || config.thick && HAS_COUNT) {
		ctx.beginPath();
		ctx.arc(CENTER, CENTER, (SIZE / 2) - PADDING, 0, 2 * Math.PI, false);
		ctx.fillStyle = backgroundColor;
		ctx.fill();
		ctx.lineWidth = SIZE / (config.thick ? 10 : 20);
		ctx.strokeStyle = backgroundColor;
		ctx.stroke();
		// Count or Icon
		if (HAS_COUNT) {
			ctx.fillStyle = color;
			ctx.textAlign = 'center';
			if (config.unreadCount > 99) {
				ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.4}px Helvetica`;
				ctx.fillText('99+', CENTER, CENTER + (SIZE * 0.15));
			} else if (config.unreadCount < 10) {
				ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.5}px Helvetica`;
				ctx.fillText(config.unreadCount, CENTER, CENTER + (SIZE * 0.20));
			} else {
				ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.5}px Helvetica`;
				ctx.fillText(config.unreadCount, CENTER, CENTER + (SIZE * 0.15));
			}

			resolve(canvas);
		} else {
			reject(canvas);
		}
	});
};
/**
 * Renders the tray icon as a native image
 * @param arg: Unread count
 * @return the native image
 */
const renderNativeImage = function (arg) {
	return Promise.resolve()
		.then(() => renderCanvas(arg))
		.then(canvas => {
			const pngData = nativeImage.createFromDataURL(canvas.toDataURL('image/png')).toPng();
			return Promise.resolve(nativeImage.createFromBuffer(pngData, config.pixelRatio));
		});
};

function sendAction(action) {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

const createTray = function () {
	window.tray = new Tray(iconPath());
	const contextMenu = Menu.buildFromTemplate([{
		label: 'About',
		click() {
			ipcRenderer.send('trayabout');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Manage Zulip servers',
		click() {
			sendAction('open-settings');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Reload',
		click() {
			sendAction('reload');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Quit',
		click() {
			remote.getCurrentWindow().close();
		}
	}
	]);
	window.tray.setContextMenu(contextMenu);
};

ipcRenderer.on('destroytray', event => {
	window.tray.destroy();
	if (window.tray.isDestroyed()) {
		window.tray = null;
	} else {
		throw new Error('Tray icon not properly destroyed.');
	}

	return event;
});

ipcRenderer.on('tray', (event, arg) => {
	if (arg === 0) {
		unread = arg;
		// Message Count // console.log("message count is zero.");
		window.tray.setImage(iconPath());
		window.tray.setToolTip('No unread messages');
	} else {
		unread = arg;
		renderNativeImage(arg).then(image => {
			window.tray.setImage(image);
			window.tray.setToolTip(arg + ' unread messages');
		});
	}
});

ipcRenderer.on('toggletray', event => {
	if (event) {
		if (window.tray) {
			window.tray.destroy();
			if (window.tray.isDestroyed()) {
				window.tray = null;
			}
		} else {
			createTray();
			renderNativeImage(unread).then(image => {
				window.tray.setImage(image);
				window.tray.setToolTip(unread + ' unread messages');
			});
		}
	}
});

createTray();
