'use strict';
const path = require('path');
const electron = require('electron');
const {ipcRenderer,remote} = electron;
const {Tray,Menu,nativeImage} = remote;

let image = null;
let tray = null;
let unread = null;
const APP_ICON = path.join(__dirname, '../../resources/tray', 'tray');

const iconPath = () => {
	if (process.platform === 'linux') {
		return APP_ICON + 'linux.png';
	}
	return APP_ICON + (process.platform === 'win32' ? 'win.ico' : 'osx.png');
};


//deafult config for Icon we might make it OS specific if needed
const config = {
		pixelRatio: window.devicePixelRatio,
		unreadCount: 0,
		showUnreadCount: true,
		unreadColor: '#000000',
		readColor: '#000000',
		unreadBackgroundColor: '#B9FEEA',
		readBackgroundColor: '#B9FEEA',
		size: 100,
		thick: process.platform === 'win32',
	}


 window.renderCanvas = function(arg) {
		config.unreadCount = arg;
		return new Promise((resolve, reject) => {
			const SIZE = config.size * config.pixelRatio
			const PADDING = SIZE * 0.05
			const CENTER = SIZE / 2
			const HAS_COUNT = config.showUnreadCount && config.unreadCount
			const color = config.unreadCount ? config.unreadColor : config.readColor
			const backgroundColor = config.unreadCount ? config.unreadBackgroundColor : config.readBackgroundColor

			const canvas = document.createElement('canvas')
			canvas.width = SIZE
			canvas.height = SIZE
			const ctx = canvas.getContext('2d')

			// Circle
			if (!config.thick || config.thick && HAS_COUNT) {
				ctx.beginPath()
				ctx.arc(CENTER, CENTER, (SIZE / 2) - PADDING, 0, 2 * Math.PI, false)
				ctx.fillStyle = backgroundColor
				ctx.fill()
				ctx.lineWidth = SIZE / (config.thick ? 10 : 20)
				ctx.strokeStyle = color
				ctx.stroke()
			}

			// Count or Icon
			if (HAS_COUNT) {
				ctx.fillStyle = color
				ctx.textAlign = 'center'
				if (config.unreadCount > 99) {
					ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.4}px Helvetica`
					ctx.fillText('99+', CENTER, CENTER + (SIZE * 0.15))
				} else if (config.unreadCount < 10) {
					ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.5}px Helvetica`
					ctx.fillText(config.unreadCount, CENTER, CENTER + (SIZE * 0.20))
				} else {
					ctx.font = `${config.thick ? 'bold ' : ''}${SIZE * 0.5}px Helvetica`
					ctx.fillText(config.unreadCount, CENTER, CENTER + (SIZE * 0.15))
				}

				resolve(canvas)
			}
		})
	}
	/**
	 * Renders the tray icon as a native image
	 * @param arg: Unread count
	 * @return the native image
	 */
window.renderNativeImage = function(arg) {
		return Promise.resolve()
			.then(() => renderCanvas(arg))
			.then((canvas) => {
				const pngData = nativeImage.createFromDataURL(canvas.toDataURL('image/png')).toPng()
				return Promise.resolve(nativeImage.createFromBuffer(pngData, config.pixelRatio))
			})
	}

window.createTray = function ()  {
	console.log("CreateTray was called");
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
			label: 'Change Zulip server',
			click() {
				ipcRenderer.send('traychangeserver');
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
					window.tray.destroy();
				}
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
});

ipcRenderer.on('tray', (event, arg) => {

	if (arg === 0) {
		console.log("message count is zero.");
		window.tray.setImage(iconPath());

	} else {
		renderNativeImage(arg).then((image) => {
			unread = arg;
			window.tray.setImage(image);
			window.tray.setToolTip(arg + 'unread messages')
		})
	}

});

ipcRenderer.on('toggletray', event => {
	if (window.tray) {
		window.tray.destroy();
		if (window.tray.isDestroyed()) {
			window.tray = null;
		}
	} else {
		window.createTray();
	}
});

createTray();
