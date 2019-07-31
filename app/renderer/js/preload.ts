// we have and will have some non camelcase stuff
// while working with zulip and electron bridge
// so turning the rule off for the whole file.
/* eslint-disable @typescript-eslint/camelcase */

'use strict';

import { ipcRenderer, shell } from 'electron';
import SetupSpellChecker from './spellchecker';

import isDev = require('electron-is-dev');
import LinkUtil = require('./utils/link-util');
import params = require('./utils/params-util');

import NetworkError = require('./pages/network');

interface PatchedGlobal extends NodeJS.Global {
	logout: () => void;
	shortcut: () => void;
	showNotificationSettings: () => void;
}

const globalPatched = global as PatchedGlobal;

// eslint-disable-next-line import/no-unassigned-import
require('./notification');

// Prevent drag and drop event in main process which prevents remote code executaion
require(__dirname + '/shared/preventdrag.js');

declare let window: ZulipWebWindow;

window.electron_bridge = require('./electron-bridge');

const logout = (): void => {
	// Create the menu for the below
	const dropdown: HTMLElement = document.querySelector('.dropdown-toggle');
	dropdown.click();

	const nodes: NodeListOf<HTMLElement> = document.querySelectorAll('.dropdown-menu li:last-child a');
	nodes[nodes.length - 1].click();
};

const shortcut = (): void => {
	// Create the menu for the below
	const node: HTMLElement = document.querySelector('a[data-overlay-trigger=keyboard-shortcuts]');
	// Additional check
	if (node.textContent.trim().toLowerCase() === 'keyboard shortcuts (?)') {
		node.click();
	} else {
		// Atleast click the dropdown
		const dropdown: HTMLElement = document.querySelector('.dropdown-toggle');
		dropdown.click();
	}
};

const showNotificationSettings = (): void => {
	// Create the menu for the below
	const dropdown: HTMLElement = document.querySelector('.dropdown-toggle');
	dropdown.click();

	const nodes: NodeListOf<HTMLElement> = document.querySelectorAll('.dropdown-menu li a');
	nodes[2].click();

	const notificationItem: NodeListOf<HTMLElement> = document.querySelectorAll('.normal-settings-list li div');

	// wait until the notification dom element shows up
	setTimeout(() => {
		notificationItem[2].click();
	}, 100);
};

process.once('loaded', (): void => {
	globalPatched.logout = logout;
	globalPatched.shortcut = shortcut;
	globalPatched.showNotificationSettings = showNotificationSettings;
});

// To prevent failing this script on linux we need to load it after the document loaded
document.addEventListener('DOMContentLoaded', (): void => {
	if (params.isPageParams()) {
	// Get the default language of the server
		const serverLanguage = page_params.default_language; // eslint-disable-line no-undef
		if (serverLanguage) {
			// Init spellchecker
			SetupSpellChecker.init(serverLanguage);
		}
		// redirect users to network troubleshooting page
		const getRestartButton = document.querySelector('.restart_get_events_button');
		if (getRestartButton) {
			getRestartButton.addEventListener('click', () => {
				ipcRenderer.send('forward-message', 'reload-viewer');
			});
		}
		// Open image attachment link in the lightbox instead of opening in the default browser
		const { $, lightbox } = window;
		$('#main_div').on('click', '.message_content p a', function (this: HTMLElement, e: Event) {
			const url = $(this).attr('href');

			if (LinkUtil.isImage(url)) {
				const $img = $(this).parent().siblings('.message_inline_image').find('img');

				// prevent the image link from opening in a new page.
				e.preventDefault();
				// prevent the message compose dialog from happening.
				e.stopPropagation();

				// Open image in the default browser if image preview is unavailable
				if (!$img[0]) {
					shell.openExternal(window.location.origin + url);
				}
				// Open image in lightbox
				lightbox.open($img);
			}
		});
	}
});

// Clean up spellchecker events after you navigate away from this page;
// otherwise, you may experience errors
window.addEventListener('beforeunload', (): void => {
	SetupSpellChecker.unsubscribeSpellChecker();
});

window.addEventListener('load', (event: any): void => {
	if (!event.target.URL.includes('app/renderer/network.html')) {
		return;
	}
	const $reconnectButton = document.querySelector('#reconnect');
	const $settingsButton = document.querySelector('#settings');
	NetworkError.init($reconnectButton, $settingsButton);
});

// electron's globalShortcut can cause unexpected results
// so adding the reload shortcut in the old-school way
// electron does not support adding multiple accelerators for a menu item
// so adding numpad shortcuts here
document.addEventListener('keydown', event => {
	const cmdOrCtrl = event.ctrlKey || event.metaKey;
	if (event.code === 'F5') {
		ipcRenderer.send('forward-message', 'hard-reload');
	} else if (cmdOrCtrl && (event.code === 'NumpadAdd' || event.code === 'Equal')) {
		ipcRenderer.send('forward-message', 'zoomIn');
	} else if (cmdOrCtrl && event.code === 'NumpadSubtract') {
		ipcRenderer.send('forward-message', 'zoomOut');
	} else if (cmdOrCtrl && event.code === 'Numpad0') {
		ipcRenderer.send('forward-message', 'zoomActualSize');
	}
});

// Set user as active and update the time of last activity
ipcRenderer.on('set-active', () => {
	if (isDev) {
		console.log('active');
	}
	window.electron_bridge.idle_on_system = false;
	window.electron_bridge.last_active_on_system = Date.now();
});

// Set user as idle and time of last activity is left unchanged
ipcRenderer.on('set-idle', () => {
	if (isDev) {
		console.log('idle');
	}
	window.electron_bridge.idle_on_system = true;
});
