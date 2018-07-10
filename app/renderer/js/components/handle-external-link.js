const { ipcRenderer } = require('electron');
const { shell, app } = require('electron').remote;
const LinkUtil = require('../utils/link-util');
const DomainUtil = require('../utils/domain-util');
const ConfigUtil = require('../utils/config-util');

function handleExternalLink(event) {
	const { url } = event;
	const domainPrefix = DomainUtil.getDomain(this.props.index).url;
	const downloadPath = ConfigUtil.getConfigItem('downloadsPath', `${app.getPath('downloads')}`);

  // Whitelist URLs which are allowed to be opened in the app
	const {
    isInternalUrl: isWhiteListURL,
    isUploadsUrl: isUploadsURL
  } = LinkUtil.isInternal(domainPrefix, url);

	if (isWhiteListURL) {
		event.preventDefault();

    // download txt, pdf, mp3, mp4 etc.. by using downloadURL in the
    // main process which allows the user to save the files to their desktop
    // and not trigger webview reload while image in webview will
    // do nothing and will not save it
		if (!LinkUtil.isImage(url) && isUploadsURL) {
			ipcRenderer.send('downloadFile', url, downloadPath);
			ipcRenderer.once('downloadFileCompleted', (event, filePath, fileName) => {
				const downloadNotification = new Notification('Download Complete', {
					body: `Click to open ${fileName}`
				});
				downloadNotification.onclick = () => {
					shell.openItem(filePath);
				};
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

module.exports = handleExternalLink;
