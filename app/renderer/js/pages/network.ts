'use strict';

import { ipcRenderer } from 'electron';

class NetworkTroubleshootingView {
	$reconnectButton: Element;
	$settingsButton: Element;
	constructor() {
		this.$reconnectButton = document.querySelector('#reconnect');
		this.$settingsButton = document.querySelector('#settings');
	}

	init(): void {
		this.$reconnectButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'reload-viewer');
		});
		this.$settingsButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'open-settings');
		});
	}
}

window.addEventListener('load', () => {
	const networkTroubleshootingView = new NetworkTroubleshootingView();
	networkTroubleshootingView.init();
});
