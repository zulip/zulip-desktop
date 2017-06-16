'use strict';

require(__dirname + '/js/tray.js');
const {ipcRenderer} = require('electron');

const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const WebView = require(__dirname + '/js/components/webview.js');
const Tab = require(__dirname + '/js/components/tab.js');

class ServerManagerView {
	constructor() {
		this.$tabsContainer = document.getElementById('tabs-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$reloadButton = $actionsContainer.querySelector('#reload-action');
		this.$addServerButton = $actionsContainer.querySelector('#add-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
		this.$content = document.getElementById('content');

		this.settingsTabIndex = -1;
		this.activeTabIndex = -1;
		this.webviews = [];
		this.tabs = [];
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
			for (let i = 0; i < servers.length; i++) {
				this.initServer(servers[i], i);
			}
			this.activateTab(0);
		} else {
			this.openSettings();
		}
	}

	initServer(server, index) {
		this.tabs.push(new Tab({
			url: server.url,
			name: server.alias,
			icon: server.icon,
			type: Tab.SERVER_TAB,
			$root: this.$tabsContainer,
			onClick: this.activateTab.bind(this, index)
		}));
		this.webviews.push(new WebView({
			$root: this.$content,
			index,
			url: server.url,
			name: server.alias,
			isActive: () => {
				return index === this.activeTabIndex;
			},
			onTitleChange: this.updateBadge.bind(this),
			nodeIntegration: false
		}));
	}

	initActions() {
		this.$reloadButton.addEventListener('click', () => {
			this.webviews[this.activeTabIndex].reload();
		});
		this.$addServerButton.addEventListener('click', this.openSettings.bind(this));
		this.$settingsButton.addEventListener('click', this.openSettings.bind(this));
	}

	openSettings() {
		if (this.settingsTabIndex !== -1) {
			this.activateTab(this.settingsTabIndex);
			return;
		}
		const url = 'file://' + __dirname + '/preference.html';

		this.settingsTabIndex = this.webviews.length;

		this.tabs.push(new Tab({
			url,
			name: 'Settings',
			type: Tab.SETTINGS_TAB,
			$root: this.$tabsContainer,
			onClick: this.activateTab.bind(this, this.settingsTabIndex)
		}));

		this.webviews.push(new WebView({
			$root: this.$content,
			index: this.settingsTabIndex,
			url,
			name: 'Settings',
			isActive: () => {
				return this.settingsTabIndex === this.activeTabIndex;
			},
			onTitleChange: this.updateBadge.bind(this),
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
				this.tabs[this.activeTabIndex].deactivate();
				this.webviews[this.activeTabIndex].hide();
			}
		}

		this.tabs[index].activate();

		this.activeTabIndex = index;
		this.webviews[index].load();
	}

	updateBadge() {
		let messageCountAll = 0;
		for (let i = 0; i < this.webviews.length; i++) {
			const count = this.webviews[i].badgeCount;
			messageCountAll += count;

			this.tabs[i].updateBadge(count);
		}

		ipcRenderer.send('update-badge', messageCountAll);
	}

	registerIpcs() {
		const webviewListeners = {
			'webview-reload': 'reload',
			back: 'back',
			focus: 'focus',
			forward: 'forward',
			zoomIn: 'zoomIn',
			zoomOut: 'zoomOut',
			zoomActualSize: 'zoomActualSize',
			'log-out': 'logOut',
			shortcut: 'showShortcut',
			'tab-devtools': 'openDevTools'
		};

		for (const key in webviewListeners) {
			ipcRenderer.on(key, () => {
				const activeWebview = this.webviews[this.activeTabIndex];
				if (activeWebview) {
					activeWebview[webviewListeners[key]]();
				}
			});
		}

		ipcRenderer.on('open-settings', this.openSettings.bind(this));
	}
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
};
