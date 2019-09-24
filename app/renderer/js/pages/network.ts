'use strict';

import { ipcRenderer } from 'electron';

class NetworkTroubleshootingView {
	init($reconnectButton: Element, $settingsButton: Element): void {
		$reconnectButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'reload-viewer');
		});
		$settingsButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'open-settings');
		});
	}
}

export = new NetworkTroubleshootingView();
