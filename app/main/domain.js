'use strict';
const electron = require('electron');
const path = require('path');
const {app} = require('electron');
const ipc = require('electron').ipcMain;

let domainWindow;

function createdomainWindow() {
    const domainwin = new electron.BrowserWindow({
        frame: false,
        height: 200,
        resizable: false,
        width: 300
    })
    const domainURL = 'file://' + path.join(__dirname, '../renderer', 'pref.html');
    domainwin.loadURL(domainURL);

    return domainwin;
}

exports = module.exports = {
    createdomainWindow
};