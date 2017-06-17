'use strict';

require(__dirname + '/js/tray.js');
const {ipcRenderer} = require('electron');

const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const WebView = require(__dirname + '/js/components/webview.js');
const ServerTab = require(__dirname + '/js/components/server-tab.js');
const FunctionalTab = require(__dirname + '/js/components/functional-tab.js');

class ServerManagerView {
	constructor() {
		this.$tabsContainer = document.getElementById('tabs-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$reloadButton = $actionsContainer.querySelector('#reload-action');
		this.$addServerButton = $actionsContainer.querySelector('#add-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
		this.$content = document.getElementById('content');

		this.activeTabIndex = -1;
		this.webviews = [];
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
			this.openSettings();
		}
	}

	initServer(server, index) {
		this.tabs.push(new ServerTab({
			icon: server.icon,
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
	
	openFunctionalTab(tabProps) {
		const {name, materialIcon, url} = tabProps;
		if (this.functionalTabs.hasOwnProperty(name)) {
			this.activateTab(this.functionalTabs[name]);
			return;
		}

		this.functionalTabs[name] = this.webviews.length;

		this.tabs.push(new FunctionalTab({
			materialIcon: tabProps.materialIcon,
			$root: this.$tabsContainer,
			onClick: this.activateTab.bind(this, this.functionalTabs[name]),
			onDestroy: this.destroyTab.bind(this, name, this.functionalTabs[name])
		}));

		this.webviews.push(new WebView({
			$root: this.$content,
			index: this.functionalTabs[name],
			url: tabProps.url,
			name: tabProps.name,
			isActive: () => {
				return this.functionalTabs[name] === this.activeTabIndex;
			},
			onTitleChange: this.updateBadge.bind(this),
			nodeIntegration: true
		}));

		this.activateTab(this.functionalTabs[name]);
	}

	openSettings() {
		this.openFunctionalTab({
				name: 'Settings',
				materialIcon: 'settings',
				url: `file://${__dirname}/preference.html`
		});
	}

	openAbout() {
		this.openFunctionalTab({
				name: 'About',
				materialIcon: 'sentiment_very_satisfied',
				url: `file://${__dirname}/about.html`
			});
	}

	activateTab(index, hideOldTab=true) {
		if (this.webviews[index].loading) {
			return;
		}

		if (this.activeTabIndex !== -1) {
			if (this.activeTabIndex === index) {
				return;
			} else if (hideOldTab) {
				this.tabs[this.activeTabIndex].deactivate();
				this.webviews[this.activeTabIndex].hide();
			}
		}

		this.tabs[index].activate();

		this.activeTabIndex = index;
		this.webviews[index].load();
	}

	destroyTab(name, index) {
		if (this.webviews[index].loading) {
			return;
		}

		this.tabs[index].$el.parentNode.removeChild(this.tabs[index].$el);
		this.webviews[index].$el.parentNode.removeChild(this.webviews[index].$el);

		delete this.tabs[index];
		delete this.webviews[index];
		delete this.functionalTabs[name];

		this.activateTab(0, false);
	}

	updateBadge() {
		let messageCountAll = 0;
		for (let i = 0; i < this.webviews.length; i++) {
			if (this.tabs[i] && this.tabs[i].hasOwnProperty('updateBadge')) {
				const count = this.webviews[i].badgeCount;
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
				const activeWebview = this.webviews[this.activeTabIndex];
				if (activeWebview) {
					activeWebview[webviewListeners[key]]();
				}
			});
		}

		ipcRenderer.on('open-settings', this.openSettings.bind(this));
		ipcRenderer.on('open-about', this.openAbout.bind(this));
	}
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();
};
