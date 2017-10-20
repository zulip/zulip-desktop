'use strict';

const { ipcRenderer } = require('electron');
const SetupSpellChecker = require('./spellchecker');

const ConfigUtil = require(__dirname + '/utils/config-util.js');

// eslint-disable-next-line import/no-unassigned-import
require('./notification');

const logout = () => {
	// Create the menu for the below
	document.querySelector('.dropdown-toggle').click();

	const nodes = document.querySelectorAll('.dropdown-menu li:last-child a');
	nodes[nodes.length - 1].click();
};

const shortcut = () => {
	// Create the menu for the below
	const node = document.querySelector('a[data-overlay-trigger=keyboard-shortcuts]');
	// Additional check
	if (node.text.trim().toLowerCase() === 'keyboard shortcuts') {
		node.click();
	} else {
		// Atleast click the dropdown
		document.querySelector('.dropdown-toggle').click();
	}
};

process.once('loaded', () => {
	global.logout = logout;
	global.shortcut = shortcut;
});

// To prevent failing this script on linux we need to load it after the document loaded
document.addEventListener('DOMContentLoaded', () => {
	// Get the default language of the server
	const serverLanguage = page_params.default_language; // eslint-disable-line no-undef, camelcase

	if (serverLanguage) {
		// Set spellcheker language
		ConfigUtil.setConfigItem('spellcheckerLanguage', serverLanguage);
		// Init spellchecker
		SetupSpellChecker.init();
	}

	// redirect users to network troubleshooting page
	const getRestartButton = document.querySelector('.restart_get_events_button');
	if (getRestartButton) {
		getRestartButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'reload-viewer');
		});
	}
});

// Clean up spellchecker events after you navigate away from this page;
// otherwise, you may experience errors
window.addEventListener('beforeunload', () => {
	SetupSpellChecker.unsubscribeSpellChecker();
});

