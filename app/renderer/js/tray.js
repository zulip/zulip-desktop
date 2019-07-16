'use strict';
const path = require('path');

const electron = require('electron');

const { ipcRenderer, remote } = electron;

const { Tray, Menu, nativeImage, BrowserWindow } = remote;

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
			const pngData = nativeImage.createFromDataURL(canvas.toDataURL('image/png')).toPNG();
			return Promise.resolve(nativeImage.createFromBuffer(pngData, {
				scaleFactor: config.pixelRatio
			}));
		});
};

function sendAction(action, ...params) {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action, ...params);
}

const createContextMenuTemplate = function (tabs) {
	const tabMenuItems = tabs.map(tab => {
		const { name, badgeCount } = tab.webview.props;
		const label = badgeCount === 0 ? name : `${name} (${badgeCount})`;
		return {
			label,
			click() {
				ipcRenderer.send('focus-app');
				sendAction('switch-server-tab', tab.props.index);
			}
		};
	});
	const windowMenuItem = [
		{
			label: 'Zulip',
			click() {
				ipcRenderer.send('focus-app');
			}
		}
	];
	const template = tabs.length > 0 ? tabMenuItems : windowMenuItem;
	const settingsAndQuit = [
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
	];
	return template.concat(settingsAndQuit);
};

const createTray = function () {
	window.tray = new Tray(iconPath());
	const contextMenu = Menu.buildFromTemplate(createContextMenuTemplate([]));
	window.tray.setContextMenu(contextMenu);
	if (process.platform === 'linux' || process.platform === 'win32') {
		window.tray.on('click', () => {
			ipcRenderer.send('toggle-app');
		});
	}
};

ipcRenderer.on('update-tray', (event, data) => {
	if (!window.tray) {
		return;
	}
	const contextMenu = Menu.buildFromTemplate(createContextMenuTemplate(data));
	window.tray.setContextMenu(contextMenu);
});

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
