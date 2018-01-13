'use strict';

const { ipcRenderer, remote } = require('electron');

const { session } = remote;

require(__dirname + '/js/tray.js');
const DomainUtil = require(__dirname + '/js/utils/domain-util.js');
const WebView = require(__dirname + '/js/components/webview.js');
const ServerTab = require(__dirname + '/js/components/server-tab.js');
const FunctionalTab = require(__dirname + '/js/components/functional-tab.js');
const ConfigUtil = require(__dirname + '/js/utils/config-util.js');

class ServerManagerView {
	constructor() {
		this.$addServerButton = document.getElementById('add-tab');
		this.$tabsContainer = document.getElementById('tabs-container');

		const $actionsContainer = document.getElementById('actions-container');
		this.$reloadButton = $actionsContainer.querySelector('#reload-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
		this.$webviewsContainer = document.getElementById('webviews-container');

		this.$addServerTooltip = document.getElementById('add-server-tooltip');
		this.$reloadTooltip = $actionsContainer.querySelector('#reload-tooltip');
		this.$settingsTooltip = $actionsContainer.querySelector('#setting-tooltip');
		this.$serverIconTooltip = document.getElementsByClassName('server-tooltip');

		this.$sidebar = document.getElementById('sidebar');

		this.$fullscreenPopup = document.getElementById('fullscreen-popup');
		this.$fullscreenEscapeKey = process.platform === 'darwin' ? '^⌘F' : 'F11';
		this.$fullscreenPopup.innerHTML = `Press ${this.$fullscreenEscapeKey} to exit full screen`;

		this.activeTabIndex = -1;
		this.tabs = [];
		this.functionalTabs = {};
		this.tabIndex = 0;
	}

	init() {
		this.loadProxy().then(() => {
			this.initSidebar();
			this.initTabs();
			this.initActions();
			this.registerIpcs();
			this.initDefaultSettings();
		});
	}

	loadProxy() {
		return new Promise(resolve => {
			const proxyEnabled = ConfigUtil.getConfigItem('useProxy', false);
			if (proxyEnabled) {
				session.fromPartition('persist:webviewsession').setProxy({
					pacScript: ConfigUtil.getConfigItem('proxyPAC', ''),
					proxyRules: ConfigUtil.getConfigItem('proxyRules', ''),
					proxyBypassRules: ConfigUtil.getConfigItem('proxyBypass', '')
				}, resolve);
			} else {
				session.fromPartition('persist:webviewsession').setProxy({
					pacScript: '',
					proxyRules: '',
					proxyBypassRules: ''
				}, resolve);
			}
		});
	}

	// Settings are initialized only when user clicks on General/Server/Network section settings
	// In case, user doesn't visit these section, those values set to be null automatically
	// This will make sure the default settings are correctly set to either true or false
	initDefaultSettings() {
		// Default settings which should be respected
		const settingOptions = {
			trayIcon: true,
			useProxy: false,
			showSidebar: true,
			badgeOption: true,
			startAtLogin: false,
			startMinimized: false,
			enableSpellchecker: true,
			showNotification: true,
			betaUpdate: false,
			silent: false,
			lastActiveTab: 0
		};

		// Platform specific settings

		if (process.platform === 'win32') {
			// Only available on Windows
			settingOptions.flashTaskbarOnMessage = true;
		}

		for (const i in settingOptions) {
			if (ConfigUtil.getConfigItem(i) === null) {
				ConfigUtil.setConfigItem(i, settingOptions[i]);
			}
		}
	}

	initSidebar() {
		const showSidebar = ConfigUtil.getConfigItem('showSidebar', true);
		this.toggleSidebar(showSidebar);
	}

	initTabs() {
		const servers = DomainUtil.getDomains();
		if (servers.length > 0) {
			for (let i = 0; i < servers.length; i++) {
				this.initServer(servers[i], i);
				DomainUtil.updateSavedServer(servers[i].url, i);
				this.activateTab(i);
			}
			// Open last active tab
			this.activateTab(ConfigUtil.getConfigItem('lastActiveTab'));
		} else {
			this.openSettings('Servers');
		}
	}

	initServer(server, index) {
		const tabIndex = this.getTabIndex();
		this.tabs.push(new ServerTab({
			role: 'server',
			icon: server.icon,
			$root: this.$tabsContainer,
			onClick: this.activateLastTab.bind(this, index),
			index,
			tabIndex,
			onHover: this.onHover.bind(this, index, server.alias),
			onHoverOut: this.onHoverOut.bind(this, index),
			webview: new WebView({
				$root: this.$webviewsContainer,
				index,
				tabIndex,
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

		const $serverImgs = document.querySelectorAll('.server-icons');
		$serverImgs.forEach($serverImg => {
			$serverImg.addEventListener('error', () => {
				$serverImg.src = 'img/icon.png';
			});
		});

		this.sidebarHoverEvent(this.$addServerButton, this.$addServerTooltip);
		this.sidebarHoverEvent(this.$settingsButton, this.$settingsTooltip);
		this.sidebarHoverEvent(this.$reloadButton, this.$reloadTooltip);
	}

	getTabIndex() {
		const currentIndex = this.tabIndex;
		this.tabIndex++;
		return currentIndex;
	}

	sidebarHoverEvent(SidebarButton, SidebarTooltip) {
		SidebarButton.addEventListener('mouseover', () => {
			SidebarTooltip.removeAttribute('style');
		});
		SidebarButton.addEventListener('mouseout', () => {
			SidebarTooltip.style.display = 'none';
		});
	}

	onHover(index, serverName) {
		this.$serverIconTooltip[index].innerHTML = serverName;
		this.$serverIconTooltip[index].removeAttribute('style');
	}

	onHoverOut(index) {
		this.$serverIconTooltip[index].style.display = 'none';
	}

	openFunctionalTab(tabProps) {
		if (this.functionalTabs[tabProps.name] !== undefined) {
			this.activateTab(this.functionalTabs[tabProps.name]);
			return;
		}

		this.functionalTabs[tabProps.name] = this.tabs.length;

		const tabIndex = this.getTabIndex();
		this.tabs.push(new FunctionalTab({
			role: 'function',
			materialIcon: tabProps.materialIcon,
			$root: this.$tabsContainer,
			index: this.functionalTabs[tabProps.name],
			tabIndex,
			onClick: this.activateTab.bind(this, this.functionalTabs[tabProps.name]),
			onDestroy: this.destroyTab.bind(this, tabProps.name, this.functionalTabs[tabProps.name]),
			webview: new WebView({
				$root: this.$webviewsContainer,
				index: this.functionalTabs[tabProps.name],
				tabIndex,
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

	activateLastTab(index) {
		// Open last active tab
		ConfigUtil.setConfigItem('lastActiveTab', index);
		// Open all the tabs in background
		this.activateTab(index);
	}

	activateTab(index, hideOldTab = true) {
		if (!this.tabs[index]) {
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

		ipcRenderer.send('update-menu', {
			tabs: this.tabs,
			activeTabIndex: this.activeTabIndex
		});

		ipcRenderer.on('toggle-sidebar', (event, state) => {
			const selector = 'webview:not([class*=disabled])';
			const webview = document.querySelector(selector);
			const webContents = webview.getWebContents();
			webContents.send('toggle-sidebar', state);
		});

		ipcRenderer.on('toogle-silent', (event, state) => {
			const webviews = document.querySelectorAll('webview');
			webviews.forEach(webview => {
				try {
					webview.setAudioMuted(state);
				} catch (err) {
					// webview is not ready yet
					webview.addEventListener('dom-ready', () => {
						webview.isAudioMuted();
					});
				}
			});
		});
	}

	destroyTab(name, index) {
		if (this.tabs[index].webview.loading) {
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

	destroyView() {
		// Clear global variables
		this.activeTabIndex = -1;
		this.tabs = [];
		this.functionalTabs = {};

		// Clear DOM elements
		this.$tabsContainer.innerHTML = '';
		this.$webviewsContainer.innerHTML = '';
	}

	reloadView() {
		// Save and remember the index of last active tab so that we can use it later
		const lastActiveTab = this.tabs[this.activeTabIndex].props.index;
		ConfigUtil.setConfigItem('lastActiveTab', lastActiveTab);

		// Destroy the current view and re-initiate it
		this.destroyView();
		this.initTabs();
	}

	// This will trigger when pressed CTRL/CMD + R [WIP]
	// It won't reload the current view properly when you add/delete a server.
	reloadCurrentView() {
		this.$reloadButton.click();
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

	toggleSidebar(show) {
		if (show) {
			this.$sidebar.classList.remove('sidebar-hide');
		} else {
			this.$sidebar.classList.add('sidebar-hide');
		}
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

		ipcRenderer.on('reload-viewer', this.reloadView.bind(this, this.tabs[this.activeTabIndex].props.index));

		ipcRenderer.on('reload-current-viewer', this.reloadCurrentView.bind(this));

		ipcRenderer.on('hard-reload', () => {
			ipcRenderer.send('reload-full-app');
		});

		ipcRenderer.on('clear-app-data', () => {
			ipcRenderer.send('clear-app-settings');
		});

		ipcRenderer.on('switch-server-tab', (event, index) => {
			this.activateTab(index);
		});

		ipcRenderer.on('reload-proxy', (event, showAlert) => {
			this.loadProxy().then(() => {
				if (showAlert) {
					alert('Proxy settings saved!');
				}
			});
		});

		ipcRenderer.on('toggle-sidebar', (event, show) => {
			this.toggleSidebar(show);
		});

		ipcRenderer.on('enter-fullscreen', () => {
			this.$fullscreenPopup.classList.add('show');
			this.$fullscreenPopup.classList.remove('hidden');
		});

		ipcRenderer.on('leave-fullscreen', () => {
			this.$fullscreenPopup.classList.remove('show');
		});

		ipcRenderer.on('focus-webview-with-id', (event, webviewId) => {
			const webviews = document.querySelectorAll('webview');
			webviews.forEach(webview => {
				const currentId = webview.getWebContents().id;
				const tabId = webview.getAttribute('data-tab-id');
				const concurrentTab = document.querySelector(`div[data-tab-id="${tabId}"]`);
				if (currentId === webviewId) {
					concurrentTab.click();
				}
			});
		});

		ipcRenderer.on('render-taskbar-icon', (event, messageCount) => {
			// Create a canvas from unread messagecounts
			function createOverlayIcon(messageCount) {
				const canvas = document.createElement('canvas');
				canvas.height = 128;
				canvas.width = 128;
				canvas.style.letterSpacing = '-5px';
				const ctx = canvas.getContext('2d');
				ctx.fillStyle = '#f42020';
				ctx.beginPath();
				ctx.ellipse(64, 64, 64, 64, 0, 0, 2 * Math.PI);
				ctx.fill();
				ctx.textAlign = 'center';
				ctx.fillStyle = 'white';
				if (messageCount > 99) {
					ctx.font = '65px Helvetica';
					ctx.fillText('99+', 64, 85);
				} else if (messageCount < 10) {
					ctx.font = '90px Helvetica';
					ctx.fillText(String(Math.min(99, messageCount)), 64, 96);
				} else {
					ctx.font = '85px Helvetica';
					ctx.fillText(String(Math.min(99, messageCount)), 64, 90);
				}
				return canvas;
			}
			ipcRenderer.send('update-taskbar-icon', createOverlayIcon(messageCount).toDataURL(), String(messageCount));
		});
	}
}

window.onload = () => {
	const serverManagerView = new ServerManagerView();
	serverManagerView.init();

	window.addEventListener('online', () => {
		serverManagerView.reloadView();
	});
};
