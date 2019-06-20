import { ipcRenderer, remote } from 'electron';

import LinkUtil = require('../utils/link-util');
import DomainUtil = require('../utils/domain-util');
import ConfigUtil = require('../utils/config-util');

const { shell, app } = remote;

const dingSound = new Audio('../resources/sounds/ding.ogg');

// TODO: TypeScript - Figure out a way to pass correct type here.
function handleExternalLink(this: any, event: any): void {
	const { url } = event;
	const domainPrefix = DomainUtil.getDomain(this.props.index).url;
	const downloadPath = ConfigUtil.getConfigItem('downloadsPath', `${app.getPath('downloads')}`);
	const shouldShowInFolder = ConfigUtil.getConfigItem('showDownloadFolder', false);

	// Whitelist URLs which are allowed to be opened in the app
	const {
		isInternalUrl: isWhiteListURL,
		isUploadsUrl: isUploadsURL
	} = LinkUtil.isInternal(domainPrefix, url);

	if (isWhiteListURL) {
		event.preventDefault();

		// Code to show pdf in a new BrowserWindow (currently commented out due to bug-upstream)
		// Show pdf attachments in a new window
		// if (LinkUtil.isPDF(url) && isUploadsURL) {
		// 	ipcRenderer.send('pdf-view', url);
		// 	return;
		// }

		// download txt, mp3, mp4 etc.. by using downloadURL in the
		// main process which allows the user to save the files to their desktop
		// and not trigger webview reload while image in webview will
		// do nothing and will not save it

		// Code to show pdf in a new BrowserWindow (currently commented out due to bug-upstream)
		// if (!LinkUtil.isImage(url) && !LinkUtil.isPDF(url) && isUploadsURL) {
		if (!LinkUtil.isImage(url) && isUploadsURL) {
			ipcRenderer.send('downloadFile', url, downloadPath);
			ipcRenderer.once('downloadFileCompleted', (_event: Event, filePath: string, fileName: string) => {
				const downloadNotification = new Notification('Download Complete', {
					body: shouldShowInFolder ? `Click to show ${fileName} in folder` : `Click to open ${fileName}`,
					silent: true // We'll play our own sound - ding.ogg
				});

				// Play sound to indicate download complete
				if (!ConfigUtil.getConfigItem('silent')) {
					dingSound.play();
				}

				downloadNotification.addEventListener('click', () => {
					if (shouldShowInFolder) {
						// Reveal file in download folder
						shell.showItemInFolder(filePath);
					} else {
						// Open file in the default native app
						shell.openItem(filePath);
					}
				});
				ipcRenderer.removeAllListeners('downloadFileFailed');
			});

			ipcRenderer.once('downloadFileFailed', () => {
				// Automatic download failed, so show save dialog prompt and download
				// through webview
				this.$el.downloadURL(url);
				ipcRenderer.removeAllListeners('downloadFileCompleted');
			});
			return;
		}

		// open internal urls inside the current webview.
		this.$el.loadURL(url);
	} else {
		event.preventDefault();
		shell.openExternal(url);
	}
}

export = handleExternalLink;
