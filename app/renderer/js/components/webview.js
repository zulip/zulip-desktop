'use strict';

const path = require('path');
const fs = require('fs');

const DomainUtil = require(__dirname + '/../utils/domain-util.js');
const ConfigUtil = require(__dirname + '/../utils/config-util.js');
const SystemUtil = require(__dirname + '/../utils/system-util.js');
const LinkUtil = require(__dirname + '/../utils/link-util.js');
const { shell, app } = require('electron').remote;

const BaseComponent = require(__dirname + '/../components/base.js');

const shouldSilentWebview = ConfigUtil.getConfigItem('silent');
class WebView extends BaseComponent {
	constructor(props) {
		super();

		this.props = props;

		this.zoomFactor = 1.0;
		this.loading = false;
		this.badgeCount = 0;
	}

	template() {
		return `<webview
					class="disabled"
					data-tab-id="${this.props.tabIndex}"
					src="${this.props.url}"
					${this.props.nodeIntegration ? 'nodeIntegration' : ''}
					disablewebsecurity
					${this.props.preload ? 'preload="js/preload.js"' : ''}
					partition="persist:webviewsession"
					webpreferences="allowRunningInsecureContent, javascript=yes">
				</webview>`;
	}

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$el);

		this.registerListeners();
	}

	registerListeners() {
		this.$el.addEventListener('new-window', event => {
			const { url } = event;
			const domainPrefix = DomainUtil.getDomain(this.props.index).url;

			if (LinkUtil.isInternal(domainPrefix, url) || url === (domainPrefix + '/')) {
				event.preventDefault();
				this.$el.loadURL(url);
			} else {
				event.preventDefault();
				shell.openExternal(url);
			}
		});

		if (shouldSilentWebview) {
			this.$el.addEventListener('dom-ready', () => {
				this.$el.setAudioMuted(true);
			});
		}

		this.$el.addEventListener('page-title-updated', event => {
			const { title } = event;
			this.badgeCount = this.getBadgeCount(title);
			this.props.onTitleChange();
		});

		this.$el.addEventListener('page-favicon-updated', event => {
			const { favicons } = event;
			// This returns a string of favicons URL. If there is a PM counts in unread messages then the URL would be like
			// https://chat.zulip.org/static/images/favicon/favicon-pms.png
			if (favicons[0].indexOf('favicon-pms') > 0 && process.platform === 'darwin') {
				// This api is only supported on macOS
				app.dock.setBadge('●');
			}
		});

		this.$el.addEventListener('dom-ready', () => {
			if (this.props.role === 'server') {
				this.$el.classList.add('onload');
			}
			this.show();
		});

		this.$el.addEventListener('did-fail-load', event => {
			const { errorDescription } = event;
			const hasConnectivityErr = (SystemUtil.connectivityERR.indexOf(errorDescription) >= 0);
			if (hasConnectivityErr) {
				console.error('error', errorDescription);
				this.props.onNetworkError();
			}
		});

		this.$el.addEventListener('did-start-loading', () => {
			let userAgent = SystemUtil.getUserAgent();
			if (!userAgent) {
				SystemUtil.setUserAgent(this.$el.getUserAgent());
				userAgent = SystemUtil.getUserAgent();
			}
			this.$el.setUserAgent(userAgent);
		});
	}

	getBadgeCount(title) {
		const messageCountInTitle = (/\(([0-9]+)\)/).exec(title);
		return messageCountInTitle ? Number(messageCountInTitle[1]) : 0;
	}

	show() {
		// Do not show WebView if another tab was selected and this tab should be in background.
		if (!this.props.isActive()) {
			return;
		}

		this.$el.classList.remove('disabled');
		setTimeout(() => {
			if (this.props.role === 'server') {
				this.$el.classList.remove('onload');
			}
		}, 1000);
		this.focus();
		this.loading = false;
		this.props.onTitleChange();
		// Injecting preload css in webview to override some css rules
		this.$el.insertCSS(fs.readFileSync(path.join(__dirname, '/../../css/preload.css'), 'utf8'));
	}

	focus() {
		// focus Webview and it's contents when Window regain focus.
		const webContents = this.$el.getWebContents();
		if (webContents && !webContents.isFocused()) {
			this.$el.focus();
			webContents.focus();
		}
	}

	hide() {
		this.$el.classList.add('disabled');
	}

	load() {
		if (this.$el) {
			this.show();
		} else {
			this.init();
		}
	}

	zoomIn() {
		this.zoomFactor += 0.1;
		this.$el.setZoomFactor(this.zoomFactor);
	}

	zoomOut() {
		this.zoomFactor -= 0.1;
		this.$el.setZoomFactor(this.zoomFactor);
	}

	zoomActualSize() {
		this.zoomFactor = 1.0;
		this.$el.setZoomFactor(this.zoomFactor);
	}

	logOut() {
		this.$el.executeJavaScript('logout()');
	}

	showShortcut() {
		this.$el.executeJavaScript('shortcut()');
	}

	openDevTools() {
		this.$el.openDevTools();
	}

	back() {
		if (this.$el.canGoBack()) {
			this.$el.goBack();
		}
	}

	forward() {
		if (this.$el.canGoForward()) {
			this.$el.goForward();
		}
	}

	reload() {
		this.hide();
		this.$el.reload();
	}

	send(...param) {
		this.$el.send(...param);
	}
}

module.exports = WebView;
