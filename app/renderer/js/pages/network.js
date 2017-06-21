'use strict';

const {ipcRenderer} = require('electron');

class NetworkTroubleshootingView {
	constructor() {
		this.$reconnectButton = document.getElementById('reconnect');
	}

	init() {
		this.$reconnectButton.addEventListener('click', () => {
			ipcRenderer.send('reload-main');
		});
	}
}

window.onload = () => {
	const networkTroubleshootingView = new NetworkTroubleshootingView();
	networkTroubleshootingView.init();
};
