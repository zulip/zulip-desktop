'use strict';
const ipcRenderer = require('electron').ipcRenderer;
const {webFrame} = require('electron');
const {spellChecker} = require('./spellchecker');

// eslint-disable-next-line import/no-unassigned-import
require('./domain');

// handle zooming functionality
const zoomIn = () => {
	webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1);
};

const zoomOut = () => {
	webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1);
};

const zoomActualSize = () => {
	webFrame.setZoomFactor(1);
};

// get zooming actions from main process
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

// To prevent failing this script on linux we need to load it after the document loaded
document.addEventListener('DOMContentLoaded', () => {
	// init spellchecker
	spellChecker();
});
