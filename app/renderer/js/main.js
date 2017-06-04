'use strict';

require(__dirname + '/js/tray.js');

const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const SystemUtil = require(__dirname + '/js/utils/system-util.js');
const {linkIsInternal, skipImages} = require(__dirname + '/../main/link-helper');
const {shell, ipcRenderer} = require('electron');
const {app, dialog} = require('electron').remote;
const WebView = require(__dirname + '/js/components/webview.js');

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
		this.webviews = [];
	}

	init() {
		this.domainUtil = new DomainUtil();
		this.initTabs();
		this.initActions();
		this.registerIpcs();
	}

	initTabs() {
		const servers = this.domainUtil.getDomains();
		if (servers.length > 0) {
			for (let i = 0; i < servers.length;i++) {
				const server = servers[i];
				this.initTab(server);
				this.webviews.push(new WebView({
					$root: this.$content,
					index: i,
					url: server.url,
					name: server.alias,
					onBadgeChange: this.updateBadge.bind(this),
					nodeIntegration: false
				}))
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

		this.settingsTabIndex = this.webviews.length;
		this.webviews.push(new WebView({
			$root: this.$content,
			index: this.settingsTabIndex,
			url: url,
			name: "Settings",
			onBadgeChange: this.updateBadge.bind(this),
			nodeIntegration: true
		}));
		this.activateTab(this.settingsTabIndex);		
	}

	activateTab(index) {
		if (this.webviews[index].loading) {
			return;
		}

		if (this.activeTabIndex !== -1) {
			if (this.activeTabIndex === index) {
				return;
			} else {
				this.getTabAt(this.activeTabIndex).classList.remove('active');
				this.webviews[this.activeTabIndex].hide();
			}
		}

		const $tab = this.getTabAt(index);
		$tab.classList.add('active');

		this.webviews[index].load();
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

	updateBadge(messageCount) {
		ipcRenderer.send('update-badge', messageCount);
	}

	registerIpcs() {
		const webviewListeners = {
			'webview-reload': 'reload',
			'back': 'back',
			'focus': 'focus',
			'forward': 'forward',
			'zoomIn': 'zoomIn',
			'zoomOut': 'zoomOut',
			'zoomActualSize': 'zoomActualSize',
			'log-out': 'logOut',
			'shortcut': 'showShortcut',
			'tab-devtools': 'openDevTools'
		}

		for (const key in webviewListeners) {
			ipcRenderer.on(key, () => {
				const activeWebview = this.webviews[this.activeTabIndex];
				if (activeWebview) {
					activeWebview[webviewListeners[key]]();
				}
			});
		}
		
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
