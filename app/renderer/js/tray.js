'use strict';
const path = require('path');

const electron = require('electron');

const {ipcRenderer, remote} = electron;

const {Tray, Menu, nativeImage, BrowserWindow} = remote;

const APP_ICON = path.join(__dirname, '../../resources/tray', 'tray');

const ConfigUtil = require(__dirname + '/utils/config-util.js');

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

	return new Promise(resolve => {
		const SIZE = config.size * config.pixelRatio;
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const image = new Image();
		canvas.width = SIZE;
		canvas.height = SIZE;

		image.src = '../resources/icon.png';
		image.onload = () => {
			ctx.drawImage(image, 7.5, 7.5, 85, 85);

			const { PI } = Math;
			const circle = new Path2D();
			circle.arc(75, 80, 20, 0.5 * PI, 2.5 * PI, false);

			ctx.fillStyle = 'red';
			ctx.fill(circle);
			ctx.fillStyle = 'white';

			let count = Number(config.unreadCount);
			if (count < 100) {
				ctx.font = '900 20px Verdana';
				ctx.fillText(count, 62, 88);
			} else {
				count = count.toString();
				count.replace(/0{3,}/, 'K+');
				ctx.font = '900 16px Verdana';
				ctx.fillText(count, 58, 86);
			}

			let pngIcon = nativeImage.createFromDataURL(canvas.toDataURL('image/png'));
			pngIcon = pngIcon.resize({ height: SIZE, width: SIZE });
			pngIcon = pngIcon.toPNG();
			const trayIcon = nativeImage.createFromBuffer(pngIcon, config.pixelRatio);
			resolve(trayIcon);
		};
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
		.then(trayIcon => {
			return Promise.resolve(trayIcon);
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
			// We need to focus the main window first
			ipcRenderer.send('focus-app');
			sendAction('open-about');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Focus',
		click() {
			ipcRenderer.send('focus-app');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Settings',
		click() {
			ipcRenderer.send('focus-app');
			sendAction('open-settings');
		}
	},
	{
		type: 'separator'
	},
	{
		label: 'Quit',
		click() {
			ipcRenderer.send('quit-app');
		}
	}
	]);
	window.tray.setContextMenu(contextMenu);
	window.tray.on('click', () => {
		// Click event only works on Windows
		if (process.platform === 'win32') {
			ipcRenderer.send('toggle-app');
		}
	});
};

ipcRenderer.on('destroytray', event => {
	if (!window.tray) {
		return;
	}

	window.tray.destroy();
	if (window.tray.isDestroyed()) {
		window.tray = null;
	} else {
		throw new Error('Tray icon not properly destroyed.');
	}

	return event;
});

ipcRenderer.on('tray', (event, arg) => {
	if (!window.tray) {
		return;
	}
	// We don't want to create tray from unread messages on macOS since it already has dock badges.
	if (process.platform === 'linux' || process.platform === 'win32') {
		if (arg === 0) {
			unread = arg;
			window.tray.setImage(iconPath());
			window.tray.setToolTip('No unread messages');
		} else {
			unread = arg;
			renderNativeImage(arg).then(image => {
				console.log(image);
				window.tray.setImage(image);
				window.tray.setToolTip(arg + ' unread messages');
			});
		}
	}
});

function toggleTray() {
	let state;
	if (window.tray) {
		state = false;
		window.tray.destroy();
		if (window.tray.isDestroyed()) {
			window.tray = null;
		}
		ConfigUtil.setConfigItem('trayIcon', false);
	} else {
		state = true;
		createTray();
		if (process.platform === 'linux' || process.platform === 'win32') {
			renderNativeImage(unread).then(image => {
				window.tray.setImage(image);
				window.tray.setToolTip(unread + ' unread messages');
			});
		}
		ConfigUtil.setConfigItem('trayIcon', true);
	}
	const selector = 'webview:not([class*=disabled])';
	const webview = document.querySelector(selector);
	const webContents = webview.getWebContents();
	webContents.send('toggletray', state);
}

ipcRenderer.on('toggletray', toggleTray);

if (ConfigUtil.getConfigItem('trayIcon', true)) {
	createTray();
}
