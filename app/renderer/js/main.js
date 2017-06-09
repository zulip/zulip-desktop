'use strict';

require(__dirname + '/js/tray.js');

const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const SystemUtil = require(__dirname + '/js/utils/system-util.js');
const { linkIsInternal, skipImages } = require(__dirname + '/../main/link-helper');
const { shell, ipcRenderer } = require('electron');
const { app, dialog } = require('electron').remote;

class ServerManagerView {
	constructor() {
		this.$tabsContainer = document.getElementById('tabs-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$addServerButton = $actionsContainer.querySelector('#add-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
		this.$content = document.getElementById('content');

		this.isLoading = false;
		this.settingsTabIndex = -1;
		this.activeTabIndex = -1;
		this.zoomFactors = [];
	}

	init() {
		this.domainUtil = new DomainUtil();
		this.systemUtil = new SystemUtil();
		this.initTabs();
		this.initActions();
		this.registerIpcs();
	}

	initTabs() {
		const servers = this.domainUtil.getDomains();
		if (servers.length > 0) {
			for (const server of servers) {
				this.initTab(server);
			}

			this.activateTab(0);
		} else {
			this.openSettings();
		}
	}

	initTab(tab) {
		const {
			url,
			icon
		} = tab;
		const tabTemplate = tab.template || `
				<div class="tab" domain="${url}">
					<div class="server-tab" style="background-image: url(${icon});"></div>
				</div>`;
		const $tab = this.insertNode(tabTemplate);
		const index = this.$tabsContainer.childNodes.length;
		this.$tabsContainer.appendChild($tab);
		$tab.addEventListener('click', this.activateTab.bind(this, index));
	}

	initWebView(url, index, nodeIntegration = false) {
		const webViewTemplate = `
			<webview
				id="webview-${index}"
				class="loading"
				src="${url}"
				${nodeIntegration ? 'nodeIntegration' : ''}
				disablewebsecurity
				preload="js/preload.js"
				webpreferences="allowRunningInsecureContent, javascript=yes">
			</webview>
		`;
		const $webView = this.insertNode(webViewTemplate);
		this.$content.appendChild($webView);
		this.isLoading = true;
		this.registerListeners($webView, index);
		this.zoomFactors[index] = 1;
	}

	startLoading(url, index) {
		const $activeWebView = document.getElementById(`webview-${this.activeTabIndex}`);
		if ($activeWebView) {
			$activeWebView.classList.add('disabled');
		}
		const $webView = document.getElementById(`webview-${index}`);
		if ($webView === null) {
			this.initWebView(url, index, this.settingsTabIndex === index);
		} else {
			this.updateBadge(index);
			$webView.classList.remove('disabled');
			$webView.focus();
		}
	}

	endLoading(index) {
		const $webView = document.getElementById(`webview-${index}`);
		this.isLoading = false;
		$webView.classList.remove('loading');
	}

	initActions() {
		this.$addServerButton.addEventListener('click', this.openSettings.bind(this));
		this.$settingsButton.addEventListener('click', this.openSettings.bind(this));
	}

	openSettings() {
		if (this.settingsTabIndex !== -1) {
			this.activateTab(this.settingsTabIndex);
			return;
		}
		const url = 'file://' + __dirname + '/preference.html';

		const settingsTabTemplate = `
				<div class="tab" domain="${url}">
					<div class="server-tab settings-tab">
						<i class="material-icons md-48">settings</i>
					</div>
				</div>`;
		this.initTab({
			alias: 'Settings',
			url,
			template: settingsTabTemplate
		});

		this.settingsTabIndex = this.$tabsContainer.childNodes.length - 1;
		this.activateTab(this.settingsTabIndex);
	}

	activateTab(index) {
		if (this.isLoading) {
			return;
		}

		if (this.activeTabIndex !== -1) {
			if (this.activeTabIndex === index) {
				return;
			} else {
				this.getTabAt(this.activeTabIndex).classList.remove('active');
			}
		}

		const $tab = this.getTabAt(index);
		$tab.classList.add('active');

		const domain = $tab.getAttribute('domain');
		this.startLoading(domain, index);
		this.activeTabIndex = index;
	}

	insertNode(html) {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = html;
		return wrapper.firstElementChild;
	}

	getTabAt(index) {
		return this.$tabsContainer.childNodes[index];
	}

	updateBadge(index) {
		const $activeWebView = document.getElementById(`webview-${index}`);
		const title = $activeWebView.getTitle();
		let messageCount = (/\(([0-9]+)\)/).exec(title);
		messageCount = messageCount ? Number(messageCount[1]) : 0;
		ipcRenderer.send('update-badge', messageCount);
	}

	registerListeners($webView, index) {
		$webView.addEventListener('new-window', event => {
			const { url } = event;
			const domainPrefix = this.domainUtil.getDomain(this.activeTabIndex).url;
			if (linkIsInternal(domainPrefix, url) && url.match(skipImages) === null) {
				event.preventDefault();
				return $webView.loadURL(url);
			}
			event.preventDefault();
			shell.openExternal(url);
		});
		$webView.addEventListener('dom-ready', this.endLoading.bind(this, index));
		$webView.addEventListener('dom-ready', () => {
			// We need to wait until the page title is ready to get badge count
			setTimeout(() => this.updateBadge(index), 1000);
		});
		$webView.addEventListener('dom-ready', () => {
			$webView.focus();
		});
		// Set webview's user-agent
		$webView.addEventListener('did-start-loading', () => {
			$webView.setUserAgent(this.systemUtil.getUserAgent() + $webView.getUserAgent());
		});
		// eslint-disable-next-line no-unused-vars
		$webView.addEventListener('did-fail-load', (event) => {
			const { errorCode, errorDescription, validatedURL } = event;
			const hasConnectivityErr = (this.systemUtil.connectivityERR.indexOf(errorDescription) >= 0);
			if (hasConnectivityErr) {
				console.error('error', errorDescription);
				this.checkConnectivity();
			}
		});
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
				const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
				activeWebview.reload();
				ipcRenderer.send('reload');
				ipcRenderer.send('destroytray');
			}
			if (index === 1) {
				app.quit();
			}
		});
	}

	registerIpcs() {
		// ipcRenderer.on('reload', () => {
		// 	const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
		// 	activeWebview.reload();
		// });

		ipcRenderer.on('back', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			if (activeWebview.canGoBack()) {
				activeWebview.goBack();
			}
		});

		ipcRenderer.on('focus', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			activeWebview.focus()
		});

		ipcRenderer.on('forward', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			if (activeWebview.canGoForward()) {
				activeWebview.goForward();
			}
		});

		// Handle zooming functionality
		ipcRenderer.on('zoomIn', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			this.zoomFactors[this.activeTabIndex] += 0.1;
			activeWebview.setZoomFactor(this.zoomFactors[this.activeTabIndex]);
		});

		ipcRenderer.on('zoomOut', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			this.zoomFactors[this.activeTabIndex] -= 0.1;
			activeWebview.setZoomFactor(this.zoomFactors[this.activeTabIndex]);
		});

		ipcRenderer.on('zoomActualSize', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			this.zoomFactors[this.activeTabIndex] = 1;
			activeWebview.setZoomFactor(this.zoomFactors[this.activeTabIndex]);
		});

		ipcRenderer.on('log-out', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			activeWebview.executeJavaScript('logout()');
		});

		ipcRenderer.on('shortcut', () => {
			const activeWebview = document.getElementById(`webview-${this.activeTabIndex}`);
			activeWebview.executeJavaScript('shortcut()');
		});

		ipcRenderer.on('open-settings', () => {
			if (this.settingsTabIndex === -1) {
				this.openSettings();
			} else {
				this.activateTab(this.settingsTabIndex);
			}
		});
	}
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
};
