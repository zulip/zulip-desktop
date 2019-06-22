'use strict';

import { ipcRenderer } from 'electron';

class NetworkTroubleshootingView {
	$reconnectButton: Element;
	constructor() {
		this.$reconnectButton = document.querySelector('#reconnect');
	}

	init(): void {
		this.$reconnectButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'reload-viewer');
		});
	}
}

window.addEventListener('load', () => {
	const networkTroubleshootingView = new NetworkTroubleshootingView();
	networkTroubleshootingView.init();
});
