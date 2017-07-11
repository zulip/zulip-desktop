'use strict';

require(__dirname + '/js/tray.js');
const {ipcRenderer} = require('electron');

const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const WebView = require(__dirname + '/js/components/webview.js');
const ServerTab = require(__dirname + '/js/components/server-tab.js');
const FunctionalTab = require(__dirname + '/js/components/functional-tab.js');

class ServerManagerView {
	constructor() {
		this.$addServerButton = document.getElementById('add-tab');
		this.$tabsContainer = document.getElementById('tabs-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$reloadButton = $actionsContainer.querySelector('#reload-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
		this.$content = document.getElementById('content');

		this.activeTabIndex = -1;
		this.tabs = [];
		this.functionalTabs = {};
	}

	init() {
		this.initTabs();
		this.initActions();
		this.registerIpcs();
	}

	initTabs() {
		const servers = DomainUtil.getDomains();
		if (servers.length > 0) {
			for (let i = 0; i < servers.length; i++) {
				this.initServer(servers[i], i);
			}
			this.activateTab(0);
		} else {
			this.openSettings('Servers');
		}
	}

	initServer(server, index) {
		this.tabs.push(new ServerTab({
			icon: server.icon,
			$root: this.$tabsContainer,
			onClick: this.activateTab.bind(this, index),
			index,
			webview: new WebView({
				$root: this.$content,
				index,
				url: server.url,
				name: server.alias,
				isActive: () => {
					return index === this.activeTabIndex;
				},
				onNetworkError: this.openNetworkTroubleshooting.bind(this),
				onTitleChange: this.updateBadge.bind(this),
				nodeIntegration: false,
				preload: true
			})
		}));
	}

	initActions() {
		this.$reloadButton.addEventListener('click', () => {
			this.tabs[this.activeTabIndex].webview.reload();
		});
		this.$addServerButton.addEventListener('click', () => {
			this.openSettings('Servers');
		});
		this.$settingsButton.addEventListener('click', () => {
			this.openSettings('General');
		});
	}

	openFunctionalTab(tabProps) {
		if (this.functionalTabs[tabProps.name] !== undefined) {
			this.activateTab(this.functionalTabs[tabProps.name]);
			return;
		}

		this.functionalTabs[tabProps.name] = this.tabs.length;

		this.tabs.push(new FunctionalTab({
			materialIcon: tabProps.materialIcon,
			$root: this.$tabsContainer,
			onClick: this.activateTab.bind(this, this.functionalTabs[tabProps.name]),
			onDestroy: this.destroyTab.bind(this, tabProps.name, this.functionalTabs[tabProps.name]),
			webview: new WebView({
				$root: this.$content,
				index: this.functionalTabs[tabProps.name],
				url: tabProps.url,
				name: tabProps.name,
				isActive: () => {
					return this.functionalTabs[tabProps.name] === this.activeTabIndex;
				},
				onNetworkError: this.openNetworkTroubleshooting.bind(this),
				onTitleChange: this.updateBadge.bind(this),
				nodeIntegration: true,
				preload: false
			})
		}));

		this.activateTab(this.functionalTabs[tabProps.name]);
	}

	openSettings(nav = 'General') {
		this.openFunctionalTab({
			name: 'Settings',
			materialIcon: 'settings',
			url: `file://${__dirname}/preference.html#${nav}`
		});
		this.tabs[this.functionalTabs.Settings].webview.send('switch-settings-nav', nav);
	}

	openAbout() {
		this.openFunctionalTab({
			name: 'About',
			materialIcon: 'sentiment_very_satisfied',
			url: `file://${__dirname}/about.html`
		});
	}

	openNetworkTroubleshooting() {
		this.openFunctionalTab({
			name: 'Network Troubleshooting',
			materialIcon: 'network_check',
			url: `file://${__dirname}/network.html`
		});
	}

	activateTab(index, hideOldTab = true) {
		if (this.tabs[index].loading) {
			return;
		}

		if (this.activeTabIndex !== -1) {
			if (this.activeTabIndex === index) {
				return;
			} else if (hideOldTab) {
				this.tabs[this.activeTabIndex].deactivate();
			}
		}

		this.activeTabIndex = index;
		this.tabs[index].activate();
	}

	destroyTab(name, index) {
		if (this.tabs[index].loading) {
			return;
		}

		this.tabs[index].destroy();

		delete this.tabs[index];
		delete this.functionalTabs[name];

		// Issue #188: If the functional tab was not focused, do not activate another tab.
		if (this.activeTabIndex === index) {
			this.activateTab(0, false);
		}
	}

	updateBadge() {
		let messageCountAll = 0;
		for (let i = 0; i < this.tabs.length; i++) {
			if (this.tabs[i] && this.tabs[i].updateBadge) {
				const count = this.tabs[i].webview.badgeCount;
				messageCountAll += count;
				this.tabs[i].updateBadge(count);
			}
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
				const activeWebview = this.tabs[this.activeTabIndex].webview;
				if (activeWebview) {
					activeWebview[webviewListeners[key]]();
				}
			});
		}

		ipcRenderer.on('open-settings', (event, settingNav) => {
			this.openSettings(settingNav);
		});
		ipcRenderer.on('open-about', this.openAbout.bind(this));
		ipcRenderer.on('switch-server-tab', (event, index) => {
			this.activateTab(index);
		});
	}
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
};

window.addEventListener('online', () => {
	ipcRenderer.send('reload-main');
});
