'use strict';
import { ipcRenderer, remote, WebviewTag, NativeImage } from 'electron';

import path = require('path');
import ConfigUtil = require('./utils/config-util.js');
const { Tray, Menu, nativeImage, BrowserWindow } = remote;

const APP_ICON = path.join(__dirname, '../../resources/tray', 'tray');

declare let window: ZulipWebWindow;

const iconPath = (): string => {
	if (process.platform === 'linux') {
		return APP_ICON + 'linux.png';
	}
	return APP_ICON + (process.platform === 'win32' ? 'win.ico' : 'osx.png');
};

let unread = 0;

const trayIconSize = (): number => {
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

const renderCanvas = function (arg: number): Promise<HTMLCanvasElement> {
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
				ctx.fillText(String(config.unreadCount), CENTER, CENTER + (SIZE * 0.20));
			} else {
				ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.5}px Helvetica`;
				ctx.fillText(String(config.unreadCount), CENTER, CENTER + (SIZE * 0.15));
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
const renderNativeImage = function (arg: number): Promise<NativeImage> {
	return Promise.resolve()
		.then(() => renderCanvas(arg))
		.then(canvas => {
			const pngData = nativeImage.createFromDataURL(canvas.toDataURL('image/png')).toPNG();
			return Promise.resolve(nativeImage.createFromBuffer(pngData, {
				scaleFactor: config.pixelRatio
			}));
		});
};

function sendAction(action: string): void {
	const win = BrowserWindow.getAllWindows()[0];

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

const createTray = function (): void {
	window.tray = new Tray(iconPath());
	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Zulip',
			click() {
				ipcRenderer.send('focus-app');
			}
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
	if (process.platform === 'linux' || process.platform === 'win32') {
		window.tray.on('click', () => {
			ipcRenderer.send('toggle-app');
		});
	}
};

ipcRenderer.on('destroytray', (event: Event): Event => {
	if (!window.tray) {
		return undefined;
	}

	window.tray.destroy();
	if (window.tray.isDestroyed()) {
		window.tray = null;
	} else {
		throw new Error('Tray icon not properly destroyed.');
	}

	return event;
});

ipcRenderer.on('tray', (_event: Event, arg: number): void => {
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

function toggleTray(): void {
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
	const webview: WebviewTag = document.querySelector(selector);
	const webContents = webview.getWebContents();
	webContents.send('toggletray', state);
}

ipcRenderer.on('toggletray', toggleTray);

if (ConfigUtil.getConfigItem('trayIcon', true)) {
	createTray();
}
