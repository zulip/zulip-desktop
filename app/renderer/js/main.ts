'use strict';

import { ipcRenderer, remote, clipboard, shell } from 'electron';
import { feedbackHolder } from './feedback';

import path = require('path');
import escape = require('escape-html');
import isDev = require('electron-is-dev');
const { session, app, Menu, dialog } = remote;

// eslint-disable-next-line import/no-unassigned-import
require('./tray');

import DomainUtil = require('./utils/domain-util');
import WebView = require('./components/webview');
import ServerTab = require('./components/server-tab');
import FunctionalTab = require('./components/functional-tab');
import ConfigUtil = require('./utils/config-util');
import DNDUtil = require('./utils/dnd-util');
import ReconnectUtil = require('./utils/reconnect-util');
import Logger = require('./utils/logger-util');
import CommonUtil = require('./utils/common-util');

const logger = new Logger({
	file: 'errors.log',
	timestamp: true
});

interface FunctionalTabProps {
	name: string;
	materialIcon: string;
	url: string;
}

interface AnyObject {
	[key: string]: any;
}

interface SettingsOptions {
	autoHideMenubar: boolean;
	trayIcon: boolean;
	useManualProxy: boolean;
	useSystemProxy: boolean;
	showSidebar: boolean;
	badgeOption: boolean;
	startAtLogin: boolean;
	startMinimized: boolean;
	enableSpellchecker: boolean;
	showNotification: boolean;
	autoUpdate: boolean;
	betaUpdate: boolean;
	errorReporting: boolean;
	customCSS: boolean;
	silent: boolean;
	lastActiveTab: number;
	dnd: boolean;
	dndPreviousSettings: {
		showNotification: boolean;
		silent: boolean;
		flashTaskbarOnMessage?: boolean;
	};
	downloadsPath: string;
	showDownloadFolder: boolean;
	flashTaskbarOnMessage?: boolean;
	dockBouncing?: boolean;
	loading?: AnyObject;
}

const rendererDirectory = path.resolve(__dirname, '..');
type ServerOrFunctionalTab = ServerTab | FunctionalTab;

class ServerManagerView {
	$addServerButton: HTMLButtonElement;
	$tabsContainer: Element;
	$reloadButton: HTMLButtonElement;
	$loadingIndicator: HTMLButtonElement;
	$settingsButton: HTMLButtonElement;
	$webviewsContainer: Element;
	$backButton: HTMLButtonElement;
	$dndButton: HTMLButtonElement;
	$addServerTooltip: HTMLElement;
	$reloadTooltip: HTMLElement;
	$loadingTooltip: HTMLElement;
	$settingsTooltip: HTMLElement;
	$serverIconTooltip: HTMLCollectionOf<HTMLElement>;
	$backTooltip: HTMLElement;
	$dndTooltip: HTMLElement;
	$sidebar: Element;
	$fullscreenPopup: Element;
	$fullscreenEscapeKey: string;
	loading: AnyObject;
	activeTabIndex: number;
	tabs: ServerOrFunctionalTab[];
	functionalTabs: AnyObject;
	tabIndex: number;
	constructor() {
		this.$addServerButton = document.querySelector('#add-tab');
		this.$tabsContainer = document.querySelector('#tabs-container');

		const $actionsContainer = document.querySelector('#actions-container');
		this.$reloadButton = $actionsContainer.querySelector('#reload-action');
		this.$loadingIndicator = $actionsContainer.querySelector('#loading-action');
		this.$settingsButton = $actionsContainer.querySelector('#settings-action');
		this.$webviewsContainer = document.querySelector('#webviews-container');
		this.$backButton = $actionsContainer.querySelector('#back-action');
		this.$dndButton = $actionsContainer.querySelector('#dnd-action');

		this.$addServerTooltip = document.querySelector('#add-server-tooltip');
		this.$reloadTooltip = $actionsContainer.querySelector('#reload-tooltip');
		this.$loadingTooltip = $actionsContainer.querySelector('#loading-tooltip');
		this.$settingsTooltip = $actionsContainer.querySelector('#setting-tooltip');

		// TODO: This should have been querySelector but the problem is that
		// querySelector doesn't return elements not present in dom whereas somehow
		// getElementsByClassName does. To fix this we need to call this after this.initTabs
		// is called in this.init.
		// eslint-disable-next-line unicorn/prefer-query-selector
		this.$serverIconTooltip = document.getElementsByClassName('server-tooltip') as HTMLCollectionOf<HTMLElement>;
		this.$backTooltip = $actionsContainer.querySelector('#back-tooltip');
		this.$dndTooltip = $actionsContainer.querySelector('#dnd-tooltip');

		this.$sidebar = document.querySelector('#sidebar');

		this.$fullscreenPopup = document.querySelector('#fullscreen-popup');
		this.$fullscreenEscapeKey = process.platform === 'darwin' ? '^⌘F' : 'F11';
		this.$fullscreenPopup.innerHTML = `Press ${this.$fullscreenEscapeKey} to exit full screen`;

		this.loading = {};
		this.activeTabIndex = -1;
		this.tabs = [];
		this.functionalTabs = {};
		this.tabIndex = 0;
	}

	init(): void {
		this.loadProxy().then(() => {
			this.initSidebar();
			this.initTabs();
			this.initActions();
			this.registerIpcs();
			this.initDefaultSettings();
		});
	}

	loadProxy(): Promise<boolean> {
		return new Promise(resolve => {
			// To change proxyEnable to useManualProxy in older versions
			const proxyEnabledOld = ConfigUtil.isConfigItemExists('useProxy');
			if (proxyEnabledOld) {
				const proxyEnableOldState = ConfigUtil.getConfigItem('useProxy');
				if (proxyEnableOldState) {
					ConfigUtil.setConfigItem('useManualProxy', true);
				}
				ConfigUtil.removeConfigItem('useProxy');
			}

			const proxyEnabled = ConfigUtil.getConfigItem('useManualProxy') || ConfigUtil.getConfigItem('useSystemProxy');
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
	initDefaultSettings(): void {
		// Default settings which should be respected
		const settingOptions: SettingsOptions = {
			autoHideMenubar: false,
			trayIcon: true,
			useManualProxy: false,
			useSystemProxy: false,
			showSidebar: true,
			badgeOption: true,
			startAtLogin: true,
			startMinimized: false,
			enableSpellchecker: true,
			showNotification: true,
			autoUpdate: true,
			betaUpdate: false,
			errorReporting: true,
			customCSS: false,
			silent: false,
			lastActiveTab: 0,
			dnd: false,
			dndPreviousSettings: {
				showNotification: true,
				silent: false
			},
			downloadsPath: `${app.getPath('downloads')}`,
			showDownloadFolder: false
		};

		// Platform specific settings

		if (process.platform === 'win32') {
			// Only available on Windows
			settingOptions.flashTaskbarOnMessage = true;
			settingOptions.dndPreviousSettings.flashTaskbarOnMessage = true;
		}

		if (process.platform === 'darwin') {
			// Only available on macOS
			settingOptions.dockBouncing = true;
		}

		if (process.platform !== 'darwin') {
			settingOptions.autoHideMenubar = false;
		}

		for (const i in settingOptions) {
			const setting = i as keyof SettingsOptions;
			if (ConfigUtil.getConfigItem(i) === null) {
				ConfigUtil.setConfigItem(i, settingOptions[setting]);
			}
		}
	}

	initSidebar(): void {
		const showSidebar = ConfigUtil.getConfigItem('showSidebar', true);
		this.toggleSidebar(showSidebar);
	}

	initTabs(): void {
		const servers = DomainUtil.getDomains();
		if (servers.length > 0) {
			for (let i = 0; i < servers.length; i++) {
				this.initServer(servers[i], i);
				DomainUtil.updateSavedServer(servers[i].url, i);
				this.activateTab(i);
			}
			// Open last active tab
			this.activateTab(ConfigUtil.getConfigItem('lastActiveTab'));
			// Remove focus from the settings icon at sidebar bottom
			this.$settingsButton.classList.remove('active');
		} else {
			this.openSettings('AddServer');
		}
	}

	initServer(server: any, index: number): void {
		const tabIndex = this.getTabIndex();
		this.tabs.push(new ServerTab({
			role: 'server',
			icon: server.icon,
			name: server.alias,
			$root: this.$tabsContainer,
			onClick: this.activateLastTab.bind(this, index),
			index,
			tabIndex,
			onHover: this.onHover.bind(this, index),
			onHoverOut: this.onHoverOut.bind(this, index),
			webview: new WebView({
				$root: this.$webviewsContainer,
				index,
				tabIndex,
				url: server.url,
				role: 'server',
				name: CommonUtil.decodeString(server.alias),
				isActive: () => {
					return index === this.activeTabIndex;
				},
				switchLoading: (loading: boolean, url: string) => {
					if (!loading && this.loading[url]) {
						this.loading[url] = false;
					} else if (loading && !this.loading[url]) {
						this.loading[url] = true;
					}
					this.showLoading(this.loading[this.tabs[this.activeTabIndex].webview.props.url]);
				},
				onNetworkError: this.openNetworkTroubleshooting.bind(this),
				onTitleChange: this.updateBadge.bind(this),
				nodeIntegration: false,
				preload: true
			})
		}));
		this.loading[server.url] = true;
	}

	initActions(): void {
		this.initDNDButton();
		this.initServerActions();
		this.initLeftSidebarEvents();
	}

	initServerActions(): void {
		const $serverImgs: NodeListOf<HTMLImageElement> = document.querySelectorAll('.server-icons');
		$serverImgs.forEach(($serverImg, index) => {
			this.addContextMenu($serverImg, index);
			if ($serverImg.src.includes('img/icon.png')) {
				this.displayInitialCharLogo($serverImg, index);
			}
			$serverImg.addEventListener('error', () => {
				this.displayInitialCharLogo($serverImg, index);
			});
		});
	}

	initLeftSidebarEvents(): void {
		this.$dndButton.addEventListener('click', () => {
			const dndUtil = DNDUtil.toggle();
			ipcRenderer.send('forward-message', 'toggle-dnd', dndUtil.dnd, dndUtil.newSettings);
		});
		this.$reloadButton.addEventListener('click', () => {
			this.tabs[this.activeTabIndex].webview.reload();
		});
		this.$addServerButton.addEventListener('click', () => {
			this.openSettings('AddServer');
		});
		this.$settingsButton.addEventListener('click', () => {
			this.openSettings('General');
		});
		this.$backButton.addEventListener('click', () => {
			this.tabs[this.activeTabIndex].webview.back();
		});

		this.sidebarHoverEvent(this.$addServerButton, this.$addServerTooltip, true);
		this.sidebarHoverEvent(this.$loadingIndicator, this.$loadingTooltip);
		this.sidebarHoverEvent(this.$settingsButton, this.$settingsTooltip);
		this.sidebarHoverEvent(this.$reloadButton, this.$reloadTooltip);
		this.sidebarHoverEvent(this.$backButton, this.$backTooltip);
		this.sidebarHoverEvent(this.$dndButton, this.$dndTooltip);
	}

	initDNDButton(): void {
		const dnd = ConfigUtil.getConfigItem('dnd', false);
		this.toggleDNDButton(dnd);
	}

	getTabIndex(): number {
		const currentIndex = this.tabIndex;
		this.tabIndex++;
		return currentIndex;
	}

	getCurrentActiveServer(): string {
		return this.tabs[this.activeTabIndex].webview.props.url;
	}

	displayInitialCharLogo($img: HTMLImageElement, index: number): void {
		/*
			index parameter needed because webview[data-tab-id] can increment
			beyond size of sidebar org array and throw error
		*/

		const $altIcon = document.createElement('div');
		const $parent = $img.parentElement;
		const $container = $parent.parentElement;
		const webviewId = $container.dataset.tabId;
		const $webview = document.querySelector(`webview[data-tab-id="${webviewId}"]`);
		const realmName = $webview.getAttribute('name');

		if (realmName === null) {
			$img.src = '/img/icon.png';
			return;
		}

		$altIcon.textContent = realmName.charAt(0) || 'Z';
		$altIcon.classList.add('server-icon');
		$altIcon.classList.add('alt-icon');

		$parent.removeChild($img);
		$parent.append($altIcon);

		this.addContextMenu($altIcon as HTMLImageElement, index);
	}

	sidebarHoverEvent(SidebarButton: HTMLButtonElement, SidebarTooltip: HTMLElement, addServer = false): void {
		SidebarButton.addEventListener('mouseover', () => {
			SidebarTooltip.removeAttribute('style');
			// To handle position of add server tooltip due to scrolling of list of organizations
			// This could not be handled using CSS, hence the top of the tooltip is made same
			// as that of its parent element.
			// This needs to handled only for the add server tooltip and not others.
			if (addServer) {
				const { top } = SidebarButton.getBoundingClientRect();
				SidebarTooltip.style.top = top + 'px';
			}
		});
		SidebarButton.addEventListener('mouseout', () => {
			SidebarTooltip.style.display = 'none';
		});
	}

	onHover(index: number): void {
		// this.$serverIconTooltip[index].innerHTML already has realm name, so we are just
		// removing the style.
		this.$serverIconTooltip[index].removeAttribute('style');
		// To handle position of servers' tooltip due to scrolling of list of organizations
		// This could not be handled using CSS, hence the top of the tooltip is made same
		// as that of its parent element.
		const { top } = this.$serverIconTooltip[index].parentElement.getBoundingClientRect();
		this.$serverIconTooltip[index].style.top = top + 'px';
	}

	onHoverOut(index: number): void {
		this.$serverIconTooltip[index].style.display = 'none';
	}

	openFunctionalTab(tabProps: FunctionalTabProps): void {
		if (this.functionalTabs[tabProps.name] !== undefined) {
			this.activateTab(this.functionalTabs[tabProps.name]);
			return;
		}

		this.functionalTabs[tabProps.name] = this.tabs.length;

		const tabIndex = this.getTabIndex();

		this.tabs.push(new FunctionalTab({
			role: 'function',
			materialIcon: tabProps.materialIcon,
			name: tabProps.name,
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
				role: 'function',
				name: tabProps.name,
				isActive: () => {
					return this.functionalTabs[tabProps.name] === this.activeTabIndex;
				},
				switchLoading: (loading: AnyObject, url: string) => {
					if (!loading && this.loading[url]) {
						this.loading[url] = false;
					} else if (loading && !this.loading[url]) {
						this.loading[url] = true;
					}
					this.showLoading(this.loading[this.tabs[this.activeTabIndex].webview.props.url]);
				},
				onNetworkError: this.openNetworkTroubleshooting.bind(this),
				onTitleChange: this.updateBadge.bind(this),
				nodeIntegration: true,
				preload: false
			})
		}));

		// To show loading indicator the first time a functional tab is opened, indicator is
		// closed when the functional tab DOM is ready, handled in webview.js
		this.$webviewsContainer.classList.remove('loaded');

		this.activateTab(this.functionalTabs[tabProps.name]);
	}

	openSettings(nav = 'General'): void {
		this.openFunctionalTab({
			name: 'Settings',
			materialIcon: 'settings',
			url: `file://${rendererDirectory}/preference.html#${nav}`
		});
		this.$settingsButton.classList.add('active');
		this.tabs[this.functionalTabs.Settings].webview.send('switch-settings-nav', nav);
	}

	openAbout(): void {
		this.openFunctionalTab({
			name: 'About',
			materialIcon: 'sentiment_very_satisfied',
			url: `file://${rendererDirectory}/about.html`
		});
	}

	openNetworkTroubleshooting(): void {
		this.openFunctionalTab({
			name: 'Network Troubleshooting',
			materialIcon: 'network_check',
			url: `file://${rendererDirectory}/network.html`
		});
	}

	activateLastTab(index: number): void {
		// Open all the tabs in background, also activate the tab based on the index
		this.activateTab(index);
		// Save last active tab via main process to avoid JSON DB errors
		ipcRenderer.send('save-last-tab', index);
	}

	// returns this.tabs in an way that does
	// not crash app when this.tabs is passed into
	// ipcRenderer. Something about webview, and props.webview
	// properties in ServerTab causes the app to crash.
	get tabsForIpc(): ServerOrFunctionalTab[] {
		const tabs: ServerOrFunctionalTab[] = [];
		this.tabs.forEach((tab: ServerOrFunctionalTab) => {
			const proto = Object.create(Object.getPrototypeOf(tab));
			const tabClone = Object.assign(proto, tab);

			tabClone.webview = { props: {} };
			tabClone.webview.props.name = tab.webview.props.name;
			delete tabClone.props.webview;
			tabs.push(tabClone);
		});

		return tabs;
	}

	activateTab(index: number, hideOldTab = true): void {
		if (!this.tabs[index]) {
			return;
		}

		if (this.activeTabIndex !== -1) {
			if (this.activeTabIndex === index) {
				return;
			} else if (hideOldTab) {
				// If old tab is functional tab Settings, remove focus from the settings icon at sidebar bottom
				if (this.tabs[this.activeTabIndex].props.role === 'function' && this.tabs[this.activeTabIndex].props.name === 'Settings') {
					this.$settingsButton.classList.remove('active');
				}
				this.tabs[this.activeTabIndex].deactivate();
			}
		}

		try {
			this.tabs[index].webview.canGoBackButton();
		} catch (err) {
		}

		this.activeTabIndex = index;
		this.tabs[index].activate();

		this.showLoading(this.loading[this.tabs[this.activeTabIndex].webview.props.url]);

		ipcRenderer.send('update-menu', {
			// JSON stringify this.tabs to avoid a crash
			// util.inspect is being used to handle circular references
			tabs: this.tabsForIpc,
			activeTabIndex: this.activeTabIndex,
			// Following flag controls whether a menu item should be enabled or not
			enableMenu: this.tabs[index].props.role === 'server'
		});
	}

	showLoading(loading: boolean): void {
		if (!loading) {
			this.$reloadButton.removeAttribute('style');
			this.$loadingIndicator.style.display = 'none';
		} else if (loading) {
			this.$reloadButton.style.display = 'none';
			this.$loadingIndicator.removeAttribute('style');
		}
	}

	destroyTab(name: string, index: number): void {
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

	destroyView(): void {
		// Show loading indicator
		this.$webviewsContainer.classList.remove('loaded');

		// Clear global variables
		this.activeTabIndex = -1;
		this.tabs = [];
		this.functionalTabs = {};

		// Clear DOM elements
		this.$tabsContainer.innerHTML = '';
		this.$webviewsContainer.innerHTML = '';
	}

	reloadView(): void {
		// Save and remember the index of last active tab so that we can use it later
		const lastActiveTab = this.tabs[this.activeTabIndex].props.index;
		ConfigUtil.setConfigItem('lastActiveTab', lastActiveTab);

		// Destroy the current view and re-initiate it
		this.destroyView();
		this.initTabs();
		this.initServerActions();
	}

	// This will trigger when pressed CTRL/CMD + R [WIP]
	// It won't reload the current view properly when you add/delete a server.
	reloadCurrentView(): void {
		this.$reloadButton.click();
	}

	updateBadge(): void {
		let messageCountAll = 0;
		for (const tab of this.tabs) {
			if (tab && tab instanceof ServerTab && tab.updateBadge) {
				const count = tab.webview.badgeCount;
				messageCountAll += count;
				tab.updateBadge(count);
			}
		}

		ipcRenderer.send('update-badge', messageCountAll);
	}

	updateGeneralSettings(setting: string, value: any): void {
		const selector = 'webview:not([class*=disabled])';
		const webview: Electron.WebviewTag = document.querySelector(selector);
		if (webview) {
			const webContents = webview.getWebContents();
			webContents.send(setting, value);
		}
	}

	toggleSidebar(show: boolean): void {
		if (show) {
			this.$sidebar.classList.remove('sidebar-hide');
		} else {
			this.$sidebar.classList.add('sidebar-hide');
		}
	}

	// Toggles the dnd button icon.
	toggleDNDButton(alert: boolean): void {
		this.$dndTooltip.textContent = (alert ? 'Disable' : 'Enable') + ' Do Not Disturb';
		this.$dndButton.querySelector('i').textContent = alert ? 'notifications_off' : 'notifications';
	}

	addContextMenu($serverImg: HTMLImageElement, index: number): void {
		$serverImg.addEventListener('contextmenu', e => {
			e.preventDefault();
			const template = [
				{
					label: 'Disconnect organization',
					click: () => {
						dialog.showMessageBox({
							type: 'warning',
							buttons: ['YES', 'NO'],
							defaultId: 0,
							message: 'Are you sure you want to disconnect this organization?'
						}, response => {
							if (response === 0) {
								DomainUtil.removeDomain(index);
								ipcRenderer.send('reload-full-app');
							}
						});
					}
				},
				{
					label: 'Copy Zulip URL',
					click: () => {
						clipboard.writeText(DomainUtil.getDomain(index).url);
					}
				}
			];
			const contextMenu = Menu.buildFromTemplate(template);
			contextMenu.popup({ window: remote.getCurrentWindow() });
		});
	}

	registerIpcs(): void {
		const webviewListeners: AnyObject = {
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
					activeWebview[webviewListeners[key] as string]();
				}
			});
		}

		ipcRenderer.on('open-settings', (event: Event, settingNav: string) => {
			this.openSettings(settingNav);
		});

		ipcRenderer.on('open-about', this.openAbout.bind(this));

		ipcRenderer.on('open-help', () => {
			// Open help page of current active server
			const helpPage = this.getCurrentActiveServer() + '/help';
			shell.openExternal(helpPage);
		});

		ipcRenderer.on('reload-viewer', this.reloadView.bind(this, this.tabs[this.activeTabIndex].props.index));

		ipcRenderer.on('reload-current-viewer', this.reloadCurrentView.bind(this));

		ipcRenderer.on('hard-reload', () => {
			ipcRenderer.send('reload-full-app');
		});

		ipcRenderer.on('clear-app-data', () => {
			ipcRenderer.send('clear-app-settings');
		});

		ipcRenderer.on('switch-server-tab', (event: Event, index: number) => {
			this.activateLastTab(index);
		});

		ipcRenderer.on('open-org-tab', () => {
			this.openSettings('AddServer');
		});

		ipcRenderer.on('reload-proxy', (event: Event, showAlert: boolean) => {
			this.loadProxy().then(() => {
				if (showAlert) {
					alert('Proxy settings saved!');
					ipcRenderer.send('reload-full-app');
				}
			});
		});

		ipcRenderer.on('toggle-sidebar', (event: Event, show: boolean) => {
			// Toggle the left sidebar
			this.toggleSidebar(show);

			// Toggle sidebar switch in the general settings
			this.updateGeneralSettings('toggle-sidebar-setting', show);
		});

		ipcRenderer.on('toggle-silent', (event: Event, state: boolean) => {
			const webviews: NodeListOf<Electron.WebviewTag> = document.querySelectorAll('webview');
			webviews.forEach(webview => {
				try {
					webview.setAudioMuted(state);
				} catch (err) {
					// webview is not ready yet
					webview.addEventListener('dom-ready', () => {
						webview.setAudioMuted(state);
					});
				}
			});
		});

		ipcRenderer.on('toggle-autohide-menubar', (event: Event, autoHideMenubar: boolean, updateMenu: boolean) => {
			if (updateMenu) {
				ipcRenderer.send('update-menu', {
					tabs: this.tabsForIpc,
					activeTabIndex: this.activeTabIndex
				});
				return;
			}
			this.updateGeneralSettings('toggle-menubar-setting', autoHideMenubar);
		});

		ipcRenderer.on('toggle-dnd', (event: Event, state: boolean, newSettings: SettingsOptions) => {
			this.toggleDNDButton(state);
			ipcRenderer.send('forward-message', 'toggle-silent', newSettings.silent);
			const selector = 'webview:not([class*=disabled])';
			const webview: Electron.WebviewTag = document.querySelector(selector);
			const webContents = webview.getWebContents();
			webContents.send('toggle-dnd', state, newSettings);
		});

		ipcRenderer.on('update-realm-name', (event: Event, serverURL: string, realmName: string) => {
			// TODO: TypeScript - Type annotate getDomains() or this domain paramter.
			DomainUtil.getDomains().forEach((domain: any, index: number) => {
				if (domain.url.includes(serverURL)) {
					const serverTooltipSelector = `.tab .server-tooltip`;
					const serverTooltips = document.querySelectorAll(serverTooltipSelector);
					serverTooltips[index].innerHTML = escape(realmName);
					this.tabs[index].props.name = escape(realmName);
					this.tabs[index].webview.props.name = realmName;

					domain.alias = escape(realmName);
					DomainUtil.db.push(`/domains[${index}]`, domain, true);
					DomainUtil.reloadDB();
					// Update the realm name also on the Window menu
					ipcRenderer.send('update-menu', {
						tabs: this.tabsForIpc,
						activeTabIndex: this.activeTabIndex
					});
				}
			});
		});

		ipcRenderer.on('update-realm-icon', (event: Event, serverURL: string, iconURL: string) => {
			// TODO: TypeScript - Type annotate getDomains() or this domain paramter.
			DomainUtil.getDomains().forEach((domain: any, index: number) => {
				if (domain.url.includes(serverURL)) {
					DomainUtil.saveServerIcon(iconURL).then((localIconUrl: string) => {
						const serverImgsSelector = `.tab .server-icons`;
						const serverImgs: NodeListOf<HTMLImageElement> = document.querySelectorAll(serverImgsSelector);
						serverImgs[index].src = localIconUrl;

						domain.icon = localIconUrl;
						DomainUtil.db.push(`/domains[${index}]`, domain, true);
						DomainUtil.reloadDB();
					});
				}
			});
		});

		ipcRenderer.on('enter-fullscreen', () => {
			this.$fullscreenPopup.classList.add('show');
			this.$fullscreenPopup.classList.remove('hidden');
		});

		ipcRenderer.on('leave-fullscreen', () => {
			this.$fullscreenPopup.classList.remove('show');
		});

		ipcRenderer.on('focus-webview-with-id', (event: Event, webviewId: number) => {
			const webviews: NodeListOf<Electron.WebviewTag> = document.querySelectorAll('webview');
			webviews.forEach(webview => {
				const currentId = webview.getWebContents().id;
				const tabId = webview.getAttribute('data-tab-id');
				const concurrentTab: HTMLButtonElement = document.querySelector(`div[data-tab-id="${tabId}"]`);
				if (currentId === webviewId) {
					concurrentTab.click();
				}
			});
		});

		ipcRenderer.on('render-taskbar-icon', (event: Event, messageCount: number) => {
			// Create a canvas from unread messagecounts
			function createOverlayIcon(messageCount: number): HTMLCanvasElement {
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

		ipcRenderer.on('open-feedback-modal', () => {
			feedbackHolder.classList.add('show');
		});

		ipcRenderer.on('copy-zulip-url', () => {
			clipboard.writeText(this.getCurrentActiveServer());
		});

		ipcRenderer.on('new-server', () => {
			this.openSettings('AddServer');
		});
	}
}

window.addEventListener('load', () => {
	const serverManagerView = new ServerManagerView();
	const reconnectUtil = new ReconnectUtil(serverManagerView);
	serverManagerView.init();
	window.addEventListener('online', () => {
		reconnectUtil.pollInternetAndReload();
	});

	window.addEventListener('offline', () => {
		reconnectUtil.clearState();
		logger.log('No internet connection, you are offline.');
	});

	// only start electron-connect (auto reload on change) when its ran
	// from `npm run dev` or `gulp dev` and not from `npm start` when
	// app is started `npm start` main process's proces.argv will have
	// `--no-electron-connect`
	const mainProcessArgv = remote.getGlobal('process').argv;
	if (isDev && !mainProcessArgv.includes('--no-electron-connect')) {
		require('electron-connect').client.create();
	}
});

export = new ServerManagerView();
