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

(async () => webFrame.executeJavaScript(
	fs.readFileSync(require.resolve('./injected'), 'utf8')
))();
