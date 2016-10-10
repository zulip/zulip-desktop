'use strict';
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const {app} = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const ipc = require('electron').ipcMain;
const Configstore = require('configstore');
const JsonDB = require('node-json-db');
const SpellChecker = require('simple-spellchecker');
const tray = require('./tray');
const appMenu = require('./menu');
const {linkIsInternal, skipImages} = require('./link-helper');

const db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
const data = db.getData('/');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();
require('electron-context-menu')();

const conf = new Configstore('Zulip-Desktop');

// spellchecker enabled
let myDictionary = null;

// prevent window being garbage collected
let mainWindow;
let targetLink;

// Load this url in main window
const staticURL = 'file://' + path.join(__dirname, '../renderer', 'index.html');

const targetURL = function () {
	if (data.domain === undefined) {
		return staticURL;
	} else {
		return data.domain;
	}
};

const isAlreadyRunning = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

if (isAlreadyRunning) {
	app.quit();
}

function checkWindowURL() {
	if (data.domain !== undefined) {
		return data.domain;
	}
	return targetLink;
}

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const spellDict = path.join(__dirname, '../../node_modules/simple-spellchecker/dict');

const iconPath = () => {
	return APP_ICON + (process.platform === 'win32' ? '.ico' : '.png');
};

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function updateDockBadge(title) {
	if (title.indexOf('Zulip') === -1) {
		return;
	}

	let messageCount = (/\(([0-9]+)\)/).exec(title);
	messageCount = messageCount ? Number(messageCount[1]) : 0;

	if (process.platform === 'darwin') {
		app.setBadgeCount(messageCount);
	}
}

function createMainWindow() {
	const win = new electron.BrowserWindow({
		// This settings needs to be saved in config
		title: 'Zulip',
		width: conf.get('width') || 1000,
		height: conf.get('height') || 600,
		icon: iconPath(),
		minWidth: 600,
		minHeight: 400,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			plugins: true,
			allowDisplayingInsecureContent: true,
			nodeIntegration: false
		}
	});

	win.loadURL(targetURL());
	win.on('closed', onClosed);
	win.setTitle('Zulip');

	// Let's save browser window position
	if (conf.get('x') || conf.get('y')) {
		win.setPosition(conf.get('x'), conf.get('y'));
	}

	if (conf.get('maximize')) {
		win.maximize();
	}

	// Handle sizing events so we can persist them.
	win.on('maximize', () => {
		conf.set('maximize', true);
	});

	win.on('unmaximize', () => {
		conf.set('maximize', false);
	});

	win.on('resize', function () {
		const size = this.getSize();
		conf.set({
			width: size[0],
			height: size[1]
		});
	});

	// on osx it's 'moved'
	win.on('move', function () {
		const pos = this.getPosition();
		conf.set({
			x: pos[0],
			y: pos[1]
		});
	});

	// stop page to update it's title
	win.on('page-title-updated', (e, title) => {
		e.preventDefault();
		updateDockBadge(title);
	});

	return win;
}

// TODO - fix certificate errors
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	electron.Menu.setApplicationMenu(appMenu);
	mainWindow = createMainWindow();
	tray.create(mainWindow);

	const page = mainWindow.webContents;

	// Add spellcheck dictionary
	SpellChecker.getDictionary('en-US', spellDict, (err, result) => {
		if (!err) {
			myDictionary = result;
		}
	});

	// Define function for consult the dictionary.
	ipc.on('checkspell', (event, word) => {
		if (myDictionary !== null && word !== null) {
			event.returnValue = myDictionary.spellCheck(word);
		}
	});

	// TODO - use global shortcut instead
	electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
		mainWindow.reload();
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+[', () => {
		if (page.canGoBack()) {
			page.goBack();
		}
	});

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+]', () => {
		if (page.canGoForward()) {
			page.goForward();
		}
	});

	page.on('dom-ready', () => {
		page.insertCSS(fs.readFileSync(path.join(__dirname, 'preload.css'), 'utf8'));
		mainWindow.show();
	});

	page.on('new-window', (event, url) => {
		if (linkIsInternal(checkWindowURL(), url) && url.match(skipImages) === null) {
			event.preventDefault();
			return mainWindow.loadURL(url);
		}
		event.preventDefault();
		electron.shell.openExternal(url);
	});
});

ipc.on('new-domain', (e, domain) => {
	// mainWindow.loadURL(domain);
	if (!mainWindow) {
		mainWindow = createMainWindow();
		mainWindow.loadURL(domain);
	} else if (mainWindow.isMinimized()) {
		mainWindow.loadURL(domain);
		mainWindow.show();
	} else {
		mainWindow.loadURL(domain);
	}
	targetLink = domain;
});
