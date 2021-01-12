import {contextBridge, ipcRenderer, webFrame} from 'electron';
import fs from 'fs';

import electron_bridge, {bridgeEvents} from './electron-bridge';
import * as NetworkError from './pages/network';

contextBridge.exposeInMainWorld('raw_electron_bridge', electron_bridge);

ipcRenderer.on('logout', () => {
	if (bridgeEvents.emit('logout')) {
		return;
	}

	// Create the menu for the below
	const dropdown: HTMLElement = document.querySelector('.dropdown-toggle');
	dropdown.click();

	const nodes: NodeListOf<HTMLElement> = document.querySelectorAll('.dropdown-menu li:last-child a');
	nodes[nodes.length - 1].click();
});

ipcRenderer.on('show-keyboard-shortcuts', () => {
	if (bridgeEvents.emit('show-keyboard-shortcuts')) {
		return;
	}

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
	if (bridgeEvents.emit('show-notification-settings')) {
		return;
	}

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
	} else if (cmdOrCtrl && event.code === 'NumpadAdd') {
		ipcRenderer.send('forward-message', 'zoomIn');
	} else if (cmdOrCtrl && event.code === 'NumpadSubtract') {
		ipcRenderer.send('forward-message', 'zoomOut');
	} else if (cmdOrCtrl && event.code === 'Numpad0') {
		ipcRenderer.send('forward-message', 'zoomActualSize');
	}
});

(async () => webFrame.executeJavaScript(
	fs.readFileSync(require.resolve('./injected'), 'utf8')
))();
