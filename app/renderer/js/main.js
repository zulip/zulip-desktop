'use strict';

require(__dirname + '/js/tray.js');

const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const SystemUtil = require(__dirname + '/js/utils/system-util.js');
const {linkIsInternal, skipImages} = require(__dirname + '/../main/link-helper');
const {shell, ipcRenderer} = require('electron');
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
				this.initServer(servers[i], i)
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
			index: index,
			url: server.url,
			name: server.alias,
			onTitleChange: this.updateTitleAndBadge.bind(this),
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
			url: url,
			name: 'Settings',
			type: Tab.SETTINGS_TAB,
			$root: this.$tabsContainer,
			onClick: this.activateTab.bind(this, this.settingsTabIndex)
		}));

		this.webviews.push(new WebView({
			$root: this.$content,
			index: this.settingsTabIndex,
			url: url,
			name: "Settings",
			onTitleChange: this.updateTitleAndBadge.bind(this),
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

		this.webviews[index].load();
		this.activeTabIndex = index;
	}

	updateTitleAndBadge(title, messageCount) {
		let messageCountAll = 0;
		for (const webview of this.webviews) {
			messageCountAll += webview.badgeCount;
		}
		ipcRenderer.send('update-badge', {
			title: title,
			messageCount: messageCountAll
		});
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

		ipcRenderer.on('open-settings', this.openSettings.bind(this));
	}
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
};
