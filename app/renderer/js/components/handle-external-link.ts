import {ipcRenderer, remote} from 'electron';

import * as ConfigUtil from '../utils/config-util';
import * as LinkUtil from '../utils/link-util';

import type WebView from './webview';

<<<<<<< HEAD
const {shell, app} = remote;
=======
const dingSound = new Audio('../resources/sounds/ding.ogg');

function handleExternalLink(index: number, url: string): void {
	const domainPrefix = DomainUtil.getDomain(index).url;
	const downloadPath = ConfigUtil.getConfigItem('downloadsPath', `${app.getPath('downloads')}`);
	const shouldShowInFolder = ConfigUtil.getConfigItem('showDownloadFolder', false);

	// Whitelist URLs which are allowed to be opened in the app
	const {
		isInternalUrl: isWhiteListURL,
		isUploadsUrl: isUploadsURL
	} = LinkUtil.isInternal(domainPrefix, url);

	if (isWhiteListURL) {
		// Code to show pdf in a new BrowserWindow (currently commented out due to bug-upstream)
		// Show pdf attachments in a new window
		// if (LinkUtil.isPDF(url) && isUploadsURL) {
		// 	ipcRenderer.send('pdf-view', url);
		// 	return;
		// }
>>>>>>> BrowserView: Add logic to handle external links.

const dingSound = new Audio('../resources/sounds/ding.ogg');

export default function handleExternalLink(this: WebView, event: Electron.NewWindowEvent): void {
	event.preventDefault();

	const url = new URL(event.url);
	const downloadPath = ConfigUtil.getConfigItem('downloadsPath', `${app.getPath('downloads')}`);

	if (LinkUtil.isUploadsUrl(this.props.url, url)) {
		ipcRenderer.send('downloadFile', url.href, downloadPath);
		ipcRenderer.once('downloadFileCompleted', async (_event: Event, filePath: string, fileName: string) => {
			const downloadNotification = new Notification('Download Complete', {
				body: `Click to show ${fileName} in folder`,
				silent: true // We'll play our own sound - ding.ogg
			});

<<<<<<< HEAD
			downloadNotification.addEventListener('click', () => {
				// Reveal file in download folder
				shell.showItemInFolder(filePath);
=======
			ipcRenderer.once('downloadFileFailed', () => {
				// Automatic download failed, so show save dialog prompt and download
				// through webview
				ipcRenderer.send('call-specific-view-function', index, 'downloadUrl', url);
				ipcRenderer.removeAllListeners('downloadFileCompleted');
>>>>>>> BrowserView: Add logic to handle external links.
			});
			ipcRenderer.removeAllListeners('downloadFileFailed');

			// Play sound to indicate download complete
			if (!ConfigUtil.getConfigItem('silent')) {
				await dingSound.play();
			}
		});

		ipcRenderer.once('downloadFileFailed', (_event: Event, state: string) => {
			// Automatic download failed, so show save dialog prompt and download
			// through webview
			// Only do this if it is the automatic download, otherwise show an error (so we aren't showing two save
			// prompts right after each other)
			// Check that the download is not cancelled by user
			if (state !== 'cancelled') {
				if (ConfigUtil.getConfigItem('promptDownload', false)) {
					// We need to create a "new Notification" to display it, but just `Notification(...)` on its own
					// doesn't work
					new Notification('Download Complete', { // eslint-disable-line no-new
						body: 'Download failed'
					});
				} else {
					this.$el.downloadURL(url.href);
				}
			}

<<<<<<< HEAD
			ipcRenderer.removeAllListeners('downloadFileCompleted');
		});
	} else {
		(async () => LinkUtil.openBrowser(url))();
=======
		// open internal urls inside the current webview.
		ipcRenderer.send('call-specific-view-function', index, 'loadUrl', url);
	} else {
		shell.openExternal(url);
>>>>>>> BrowserView: Add logic to handle external links.
	}
}
