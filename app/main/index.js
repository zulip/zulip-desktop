'use strict';
const path = require('path');
const electron = require('electron');
const {app, shell} = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const ipc = require('electron').ipcMain;
const Configstore = require('configstore');
const JsonDB = require('node-json-db');
const tray = require('./tray');
const link = require ('./link_helper');
const {linkIsInternal} = link;

const db = new JsonDB("domain", true, true);
const data = db.getData("/");

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();
require('electron-context-menu')();

const conf = new Configstore("Zulip-Desktop");

// spellchecker enabled
const SpellChecker = require('simple-spellchecker');
let myDictionary = null;

// prevent window being garbage collected
let mainWindow;
let targetLink;

// Load this url in main window
const targetUrl = 'file://' + path.join(__dirname, '../renderer', 'index.html');

function checkWindowURL() {
	if (data["domain"] !== undefined) {
		return data["domain"]
	}
	return targetLink
}

const APP_ICON = path.join(__dirname, '../resources', 'Icon');

const iconPath = () => {
  return process.platform === 'win32'
    ? APP_ICON + '.ico'
    : APP_ICON + '.png'
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

	console.log(messageCount);

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
			nodeIntegration: true,
			plugins: true
		}
	});

	win.loadURL(targetUrl);
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
	win.on('maximize', function (event) {
	  conf.set('maximize', true);
	});

	win.on('unmaximize', function (event) {
	  conf.set('maximize', false);
	});

	win.on('resize', function (event) {
	  var size = this.getSize();
	  conf.set({
	    width: size[0],
	    height: size[1]
	  });
	});

	// on osx it's 'moved'
	win.on('move', function (event) {
	  var pos = this.getPosition();
	  conf.set({
	    x: pos[0],
	    y: pos[1]
	  });
	});

	// stop page to update it's title
	win.on('page-title-updated', (e,title) => {
	e.preventDefault();
	updateDockBadge(title);
	});

	return win;
}

// TODO
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
	mainWindow = createMainWindow();
	tray.create(mainWindow);

	const page = mainWindow.webContents;

	// Add spellcheck dictionary
	SpellChecker.getDictionary("en-US", "./node_modules/simple-spellchecker/dict", function(err, result) {
	    if(!err) {
	        myDictionary = result;
	    }
	});

	// Define function for consult the dictionary.
	ipc.on('checkspell', function(event, word) {
	    var res = null;
	    if(myDictionary != null && word != null) {
	        res = myDictionary.spellCheck(word);
	    }
	    event.returnValue = res;
	});


	// TODO - use global shortcut instead

	electronLocalshortcut.register(mainWindow, 'CommandOrControl+R', () => {
	   mainWindow.reload();
	 });

	electronLocalshortcut.register(mainWindow, 'Alt+Left', () => {
		if (page.canGoBack()) {
			page.goBack();
		}
	 });

    electronLocalshortcut.register(mainWindow, 'CommandOrControl+=', () => {
    	page.executeJavaScript('zoomIn()');
	});

    electronLocalshortcut.register(mainWindow, 'CommandOrControl+-', () => {
		page.executeJavaScript('zoomOut()');
    });

   	electronLocalshortcut.register(mainWindow, 'CommandOrControl+0', () => {
		page.executeJavaScript('zoomActualSize()');
	});

    page.on('new-window', (event, url) => {
        if (mainWindow.useDefaultWindowBehaviour) {
            mainWindow.useDefaultWindowBehaviour = false;
            return;
        }
        if (linkIsInternal(checkWindowURL(), url)) {
        	event.preventDefault();
			return mainWindow.loadURL(url);
        }
        event.preventDefault();
        electron.shell.openExternal(url);
    });
});

ipc.on('new-domain', function (e, domain) {
	mainWindow.loadURL(domain);
	targetLink = domain;
});
