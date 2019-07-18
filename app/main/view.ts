'use strict';

import { BrowserView } from 'electron';

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
	loading: true;
	badgeCount: number;
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
		this.loading = true;
		this.badgeCount = 0;
		this.customCSS = ConfigUtil.getConfigItem('customCSS');
		this.registerListeners();
	}

	registerListeners(): void {
		if (shouldSilentWebview) {
			this.webContents.addListener('dom-ready', () => {
				this.webContents.setAudioMuted(true);
			});
		}
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
		this.loading = true;
		this.webContents.reload();
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
}
