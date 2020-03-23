import { ipcRenderer, remote } from 'electron';

import * as LinkUtil from '../utils/link-util';
import * as ConfigUtil from '../utils/config-util';
import type WebView from './webview';

const { shell, app } = remote;

const dingSound = new Audio('../resources/sounds/ding.ogg');

export default function handleExternalLink(this: WebView, event: Electron.NewWindowEvent): void {
	event.preventDefault();

	const url = new URL(event.url);
	const downloadPath = ConfigUtil.getConfigItem('downloadsPath', `${app.getPath('downloads')}`);

	if (LinkUtil.isUploadsUrl(this.props.url, url)) {
		ipcRenderer.send('downloadFile', url.href, downloadPath);
		ipcRenderer.once('downloadFileCompleted', (_event: Event, filePath: string, fileName: string) => {
			const downloadNotification = new Notification('Download Complete', {
				body: `Click to show ${fileName} in folder`,
				silent: true // We'll play our own sound - ding.ogg
			});

			// Play sound to indicate download complete
			if (!ConfigUtil.getConfigItem('silent')) {
				dingSound.play();
			}

			downloadNotification.addEventListener('click', () => {
				// Reveal file in download folder
				shell.showItemInFolder(filePath);
			});
			ipcRenderer.removeAllListeners('downloadFileFailed');
		});

		ipcRenderer.once('downloadFileFailed', () => {
			// Automatic download failed, so show save dialog prompt and download
			// through webview
			// Only do this if it is the automatic download, otherwise show an error (so we aren't showing two save
			// prompts right after each other)
			if (ConfigUtil.getConfigItem('promptDownload', false)) {
				// We need to create a "new Notification" to display it, but just `Notification(...)` on its own
				// doesn't work
				new Notification('Download Complete', { // eslint-disable-line no-new
					body: 'Download failed'
				});
			} else {
				this.$el.downloadURL(url.href);
			}
			ipcRenderer.removeAllListeners('downloadFileCompleted');
		});
	} else {
		shell.openExternal(url.href);
	}
}
