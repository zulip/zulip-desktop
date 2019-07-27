'use strict';

import { BrowserView, BrowserWindow, app } from 'electron';

import ConfigUtil = require('../renderer/js/utils/config-util');
const shouldSilentWebview = ConfigUtil.getConfigItem('silent');

export interface ViewProps {
	index: number;
	url: string;
	name: string;
	nodeIntegration: boolean;
	preload: boolean;
}

export class View extends BrowserView {
	index: number;
	url: string;
	zoomFactor: number;
	customCSS: boolean;

	constructor(public props: ViewProps) {
		super({
			webPreferences: {
				preload: props.preload ? `${__dirname}/../renderer/js/preload.js` : '',
				nodeIntegration: props.nodeIntegration,
				partition: 'persist:view',
				plugins: true
			}
		});
		this.index = props.index;
		this.url = props.url;
		this.zoomFactor = 1.0;
		this.customCSS = ConfigUtil.getConfigItem('customCSS');
		this.registerListeners();
	}

	registerListeners(): void {
		if (shouldSilentWebview) {
			this.webContents.addListener('dom-ready', () => {
				this.webContents.setAudioMuted(true);
			});
		}

		this.webContents.addListener('did-navigate-in-page', () => {
			const isSettingsPage = this.url.includes('renderer/preference.html');
			if (isSettingsPage) {
				return;
			}
			this.canGoBackButton();
		});

		this.webContents.addListener('did-navigate', () => {
			this.canGoBackButton();
		});

		this.webContents.addListener('did-start-loading', () => {
			this.switchLoadingIndicator(true);
		});

		this.webContents.addListener('dom-ready', () => {
			this.sendAction('switch-loading', false, this.url);
		});

		this.webContents.addListener('did-stop-loading', () => {
			this.switchLoadingIndicator(false);
		});

		this.webContents.addListener('page-title-updated', (e: Event, title: string) => {
			const badgeCount = this.getBadgeCount(title);
			this.sendAction('update-badge-count', badgeCount, this.url);
		});

		this.webContents.addListener('page-favicon-updated', (e: Event, favicons: string[]) => {
			// This returns a string of favicons URL. If there is a PM counts in unread messages then the URL would be like
			// https://chat.zulip.org/static/images/favicon/favicon-pms.png
			if (favicons[0].indexOf('favicon-pms') > 0 && process.platform === 'darwin') {
				// This api is only supported on macOS
				app.dock.setBadge('●');
				// bounce the dock
				if (ConfigUtil.getConfigItem('dockBouncing')) {
					app.dock.bounce();
				}
			}
		});

		this.webContents.addListener('new-window', (e: Event, urlToOpen: string) => {
			e.preventDefault();
			this.sendAction('handle-link', this.index, urlToOpen);
		});
	}

	zoomIn(): void {
		this.zoomFactor += 0.1;
		this.webContents.setZoomFactor(this.zoomFactor);
	}

	zoomOut(): void {
		this.zoomFactor -= 0.1;
		this.webContents.setZoomFactor(this.zoomFactor);
	}

	zoomActualSize(): void {
		this.zoomFactor = 1.0;
		this.webContents.setZoomFactor(this.zoomFactor);
	}

	reload(): void {
		this.switchLoadingIndicator(true);
		this.webContents.reload();
	}

	switchLoadingIndicator(state: boolean): void {
		const isSettingsPage = this.url.includes('renderer/preference.html');
		if (!isSettingsPage) {
			this.sendAction('switch-loading', state, this.url);
		}
	}

	forward(): void {
		if (this.webContents.canGoForward()) {
			this.webContents.goForward();
		}
	}

	back(): void {
		if (this.webContents.canGoBack()) {
			this.webContents.goBack();
		}
	}

	logOut(): void {
		this.webContents.executeJavaScript('logout()');
	}

	showShortcut(): void {
		this.webContents.executeJavaScript('shortcut()');
	}

	toggleDevTools(): void {
		this.webContents.toggleDevTools();
	}

	canGoBackButton(): void {
		if (this.webContents.canGoBack()) {
			this.sendAction('switch-back', true);
		} else {
			this.sendAction('switch-back', false);
		}
	}

	getBadgeCount(title: string): number {
		const messageCountInTitle = (/\((\d+)\)/).exec(title);
		return messageCountInTitle ? Number(messageCountInTitle[1]) : 0;
	}

	downloadUrl(url: string): void {
		this.webContents.downloadURL(url);
	}

	loadUrl(url: string): void {
		this.webContents.loadURL(url);
	}

	sendAction(action: any, ...params: any[]): void {
		const win = BrowserWindow.getAllWindows()[0];

		if (process.platform === 'darwin') {
			win.restore();
		}

		win.webContents.send(action, ...params);
	}
}
