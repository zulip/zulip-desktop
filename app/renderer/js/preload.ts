'use strict';

import { ipcRenderer, shell } from 'electron';
import SetupSpellChecker from './spellchecker';

import LinkUtil = require('./utils/link-util');
import params = require('./utils/params-util');

interface PatchedGlobal extends NodeJS.Global {
	logout: () => void;
	shortcut: () => void;
}

const globalPatched = global as PatchedGlobal;

// eslint-disable-next-line import/no-unassigned-import
require('./notification');

// Prevent drag and drop event in main process which prevents remote code executaion
require(__dirname + '/shared/preventdrag.js');

declare let window: ZulipWebWindow;

// eslint-disable-next-line @typescript-eslint/camelcase
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

process.once('loaded', (): void => {
	globalPatched.logout = logout;
	globalPatched.shortcut = shortcut;
});

// To prevent failing this script on linux we need to load it after the document loaded
document.addEventListener('DOMContentLoaded', (): void => {
	if (params.isPageParams()) {
	// Get the default language of the server
		const serverLanguage = page_params.default_language; // eslint-disable-line no-undef, @typescript-eslint/camelcase
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

// electron's globalShortcut can cause unexpected results
// so adding the reload shortcut in the old-school way
// Zoom from numpad keys is not supported by electron, so adding it through listeners.
document.addEventListener('keydown', event => {
	if (event.code === 'F5') {
		ipcRenderer.send('forward-message', 'hard-reload');
	} else if (event.ctrlKey && event.code === 'NumpadAdd') {
		ipcRenderer.send('forward-message', 'zoomIn');
	} else if (event.ctrlKey && event.code === 'NumpadSubtract') {
		ipcRenderer.send('forward-message', 'zoomOut');
	} else if (event.ctrlKey && event.code === 'Numpad0') {
		ipcRenderer.send('forward-message', 'zoomActualSize');
	}
});
