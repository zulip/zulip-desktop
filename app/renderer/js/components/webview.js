'use strict';

const DomainUtil = require(__dirname + '/../utils/domain-util.js');
const SystemUtil = require(__dirname + '/../utils/system-util.js');
const LinkUtil = require(__dirname + '/../utils/link-util.js');
const {app, dialog, shell} = require('electron').remote;
const {ipcRenderer} = require('electron');

const BaseComponent = require(__dirname + '/../components/base.js');

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
					src="${this.props.url}"
					${this.props.nodeIntegration ? 'nodeIntegration' : ''}
					disablewebsecurity
					preload="js/preload.js"
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
			const {url} = event;
			const domainPrefix = DomainUtil.getDomain(this.props.index).url;

			if (LinkUtil.isInternal(domainPrefix, url)) {
				event.preventDefault();
				this.$el.loadURL(url);
			} else {
				event.preventDefault();
				shell.openExternal(url);
			}
		});

		this.$el.addEventListener('page-title-updated', event => {
			const {title} = event;
			this.badgeCount = this.getBadgeCount(title);
			this.props.onTitleChange();
		});

		this.$el.addEventListener('dom-ready', this.show.bind(this));

		this.$el.addEventListener('did-fail-load', event => {
			const {errorDescription} = event;
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
		this.focus();
		this.loading = false;
		this.props.onTitleChange(this.$el.getTitle());
	}

	focus() {
		this.$el.focus();
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

	checkConnectivity() {
		return dialog.showMessageBox({
			title: 'Internet connection problem',
			message: 'No internet available! Try again?',
			type: 'warning',
			buttons: ['Try again', 'Close'],
			defaultId: 0
		}, index => {
			if (index === 0) {
				this.reload();
				ipcRenderer.send('reload');
				ipcRenderer.send('destroytray');
			}
			if (index === 1) {
				app.quit();
			}
		});
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
}

module.exports = WebView;
