'use strict';
const path = require('path');
const electron = require('electron');


let aboutWindow;

function onClosed() {
    aboutWindow = null;
}

function createAboutWindow() {
    const aboutwin = new electron.BrowserWindow({
        width: 500,
        height: 500,
        title: 'About Zulip Desktop',
        show: false,
        center: true,
        fullscreen: false,
        fullscreenable: false,
		resizable: false
    })
    const aboutURL = 'file://' + path.join(__dirname, '../renderer', 'about.html');
    aboutwin.loadURL(aboutURL);
    aboutwin.on('closed', onClosed);

    // stop page to update it's title
    aboutwin.on('page-title-updated', (e) => {
	   e.preventDefault();
	});

    return aboutwin;
}

exports = module.exports = {
    createAboutWindow, onClosed
};
