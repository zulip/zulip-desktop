'use strict';
const ipcRenderer = require('electron').ipcRenderer;

// Handle zooming functionality

const zoomIn = () => {
	webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
};

const zoomOut = () => {
	webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);
};

const zoomActualSize = () => {
	webFrame.setZoomFactor(1);
};

// Get zooming actions from main process
ipcRenderer.on('zoomIn', () => {
	zoomIn();
});

ipcRenderer.on('zoomOut', () => {
	zoomOut();
});

ipcRenderer.on('zoomActualSize', () => {
	zoomActualSize();
});

ipcRenderer.on('log-out', () => {
	// create the menu for the below
	document.querySelector('.dropdown-toggle').click();

	const nodes = document.querySelectorAll('.dropdown-menu li:last-child a');
	nodes[nodes.length - 1].click();
});

ipcRenderer.on('shortcut', () => {
	// create the menu for the below
	document.querySelector('.dropdown-toggle').click();

	const nodes = document.querySelectorAll('.dropdown-menu li:nth-child(4) a');
	nodes[nodes.length - 1].click();
});

require('./domain');
require('./spellchecker');
