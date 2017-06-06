'use strict';

const DomainUtil = require(__dirname + '/../utils/domain-util.js');
const SystemUtil = require(__dirname + '/../utils/system-util.js');
const {linkIsInternal, skipImages} = require(__dirname + '/../../../main/link-helper');
const {app, dialog} = require('electron').remote;
const {ipcRenderer} = require('electron');

const BaseComponent = require(__dirname + '/../components/base.js');

class WebView extends BaseComponent {
	constructor(params) {
		super();
	
        const {$root, url, index, name, onTitleChange, nodeIntegration} = params;
        this.$root = $root;
        this.index = index;
        this.name = name;
        this.url = url;
        this.nodeIntegration = nodeIntegration;

        this.onTitleChange = onTitleChange;
        this.zoomFactor = 1.0;
        this.loading = false;
        this.domainUtil = new DomainUtil();
        this.systemUtil = new SystemUtil();
        this.badgeCount = 0;
	}

	template() {
		return `<webview
                    id="webview-${this.index}"
                    class="disabled"
                    src="${this.url}"
                    ${this.nodeIntegration ? 'nodeIntegration' : ''}
                    disablewebsecurity
                    preload="js/preload.js"
                    useragent="${this.systemUtil.getUserAgent()}"
                    webpreferences="allowRunningInsecureContent, javascript=yes">
                </webview>`;
    }

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.$root.appendChild(this.$el);

		this.registerListeners();
	}

	registerListeners() {
		this.$el.addEventListener('new-window', event => {
			const {url} = event;
			const domainPrefix = this.domainUtil.getDomain(this.index).url;

			if (linkIsInternal(domainPrefix, url) && url.match(skipImages) === null) {
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
            this.onTitleChange(title);
		});

		this.$el.addEventListener('dom-ready', this.show.bind(this));

        this.$el.addEventListener('did-fail-load', (event) => {
			const {errorCode, errorDescription, validatedURL} = event;
			const hasConnectivityErr = (this.systemUtil.connectivityERR.indexOf(errorDescription) >= 0);
			if (hasConnectivityErr) {
				console.error('error', errorDescription);
				this.checkConnectivity();
			}
		});

		this.$el.addEventListener('did-start-loading', () => {
			let userAgent = this.systemUtil.getUserAgent();
			if (!this.systemUtil.getUserAgent()) {
				this.systemUtil.setUserAgent(this.$el.getUserAgent());
				userAgent = this.systemUtil.getUserAgent();
			}
			this.$el.setUserAgent(userAgent);
		});
	}

    getBadgeCount(title) {
		let messageCountInTitle = (/\(([0-9]+)\)/).exec(title);
		return messageCountInTitle ? Number(messageCountInTitle[1]) : 0;
    }

    show() {
        this.$el.classList.remove('disabled');
        this.focus()
        this.loading = false;
        this.onTitleChange(this.$el.getTitle());
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