'use strict';
const ipcRenderer = require('electron').ipcRenderer;
const {webFrame} = require('electron');
const {spellChecker} = require('./spellchecker');

const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
process.once('loaded', () => {
	global.setImmediate = _setImmediate;
	global.clearImmediate = _clearImmediate;
});

// eslint-disable-next-line import/no-unassigned-import
require('./domain');
// eslint-disable-next-line import/no-unassigned-import
require('./tray.js');
// Calling Tray.js in renderer process everytime app window loads

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
	// Create the menu for the below
	document.querySelector('.dropdown-toggle').click();

	const nodes = document.querySelectorAll('.dropdown-menu li:last-child a');
	nodes[nodes.length - 1].click();
});

ipcRenderer.on('shortcut', () => {
	// Create the menu for the below
	const node = document.querySelector('a[data-overlay-trigger=keyboard-shortcuts]');
	// Additional check
	if (node.text.trim().toLowerCase() === 'keyboard shortcuts') {
		node.click();
	} else {
		// Atleast click the dropdown
		document.querySelector('.dropdown-toggle').click();
	}
});

// To prevent failing this script on linux we need to load it after the document loaded
document.addEventListener('DOMContentLoaded', () => {
	// Init spellchecker
	spellChecker();
});
