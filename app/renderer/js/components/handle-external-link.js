const { shell } = require('electron').remote;
const LinkUtil = require('../utils/link-util');
const DomainUtil = require('../utils/domain-util');
const hiddenWebView = require('../components/hidden-webview');

function handleExternalLink(event) {
	const { url } = event;
	const domainPrefix = DomainUtil.getDomain(this.props.index).url;

  // Whitelist URLs which are allowed to be opened in the app
	const {
    isInternalUrl: isWhiteListURL,
    isUploadsUrl: isUploadsURL
  } = LinkUtil.isInternal(domainPrefix, url);

	if (isWhiteListURL) {
		event.preventDefault();

    // only open the pdf in hidden webview since opening the
    // image in webview will do nothing and will not save it
    // whereas the pdf will be saved to user desktop once openened in
    // in the hidden webview and will not trigger webview reload
		if (!LinkUtil.isImage(url) && isUploadsURL) {
			hiddenWebView.loadURL(url);
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
