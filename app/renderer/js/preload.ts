import {contextBridge, ipcRenderer, webFrame} from 'electron';
import fs from 'fs';

import isDev from 'electron-is-dev';

import * as NetworkError from './pages/network';

// eslint-disable-next-line import/no-unassigned-import
import './notification';

// Prevent drag and drop event in main process which prevents remote code executaion
// eslint-disable-next-line import/no-unassigned-import
import './shared/preventdrag';

import electron_bridge from './electron-bridge';
contextBridge.exposeInMainWorld('raw_electron_bridge', electron_bridge);

ipcRenderer.on('logout', () => {
	// Create the menu for the below
	const dropdown: HTMLElement = document.querySelector('.dropdown-toggle');
	dropdown.click();

	const nodes: NodeListOf<HTMLElement> = document.querySelectorAll('.dropdown-menu li:last-child a');
	nodes[nodes.length - 1].click();
});

ipcRenderer.on('shortcut', () => {
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
});

ipcRenderer.on('show-notification-settings', () => {
	// Create the menu for the below
	const dropdown: HTMLElement = document.querySelector('.dropdown-toggle');
	dropdown.click();

	const nodes: NodeListOf<HTMLElement> = document.querySelectorAll('.dropdown-menu li a');
	nodes[2].click();

	const notificationItem: NodeListOf<HTMLElement> = document.querySelectorAll('.normal-settings-list li div');

	// Wait until the notification dom element shows up
	setTimeout(() => {
		notificationItem[2].click();
	}, 100);
});

electron_bridge.once('zulip-loaded', () => {
	// Redirect users to network troubleshooting page
	const getRestartButton = document.querySelector('.restart_get_events_button');
	if (getRestartButton) {
		getRestartButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'reload-viewer');
		});
	}
});

window.addEventListener('load', (event: any): void => {
	if (!event.target.URL.includes('app/renderer/network.html')) {
		return;
	}

	const $reconnectButton = document.querySelector('#reconnect');
	const $settingsButton = document.querySelector('#settings');
	NetworkError.init($reconnectButton, $settingsButton);
});

// Electron's globalShortcut can cause unexpected results
// so adding the reload shortcut in the old-school way
// Zoom from numpad keys is not supported by electron, so adding it through listeners.
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

	electron_bridge.idle_on_system = false;
	electron_bridge.last_active_on_system = Date.now();
});

// Set user as idle and time of last activity is left unchanged
ipcRenderer.on('set-idle', () => {
	if (isDev) {
		console.log('idle');
	}

	electron_bridge.idle_on_system = true;
});

(async () => webFrame.executeJavaScript(
	fs.readFileSync(require.resolve('./injected'), 'utf8')
))();
