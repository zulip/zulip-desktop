'use strict';
const electron = require('electron');
const path = require('path');

let domainWindow;
let aboutWindow;

function onClosed() {
    // dereference the window
    domainWindow = null;
    aboutWindow = null;
}

// Change Zulip server Window
function createdomainWindow() {
    const domainwin = new electron.BrowserWindow({
        frame: false,
        height: 300,
        resizable: false,
        width: 400
    })
    const domainURL = 'file://' + path.join(__dirname, '../renderer', 'pref.html');
    domainwin.loadURL(domainURL);
    domainwin.on('closed', onClosed);

    return domainwin;
}

// Call this window onClick addDomain in tray
function addDomain(){
    domainWindow = createdomainWindow();
    domainWindow.show();
};

// About window
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

    aboutwin.on('closed', onClosed);

    return aboutwin;
}

// Call this onClick About in tray
function About() {
    aboutWindow = createAboutWindow();
    aboutWindow.show();
};

exports = module.exports = {
   addDomain,About
};