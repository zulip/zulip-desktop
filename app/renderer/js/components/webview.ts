'use strict';
import { remote } from 'electron';

import path = require('path');
import fs = require('fs');
import ConfigUtil = require('../utils/config-util');
import SystemUtil = require('../utils/system-util');
import BaseComponent = require('../components/base');
import handleExternalLink = require('../components/handle-external-link');

const { app, dialog } = remote;

const shouldSilentWebview = ConfigUtil.getConfigItem('silent');

// TODO: TypeScript - Type annotate WebViewProps.
interface WebViewProps {
	[key: string]: any;
}

class WebView extends BaseComponent {
	props: any;
	zoomFactor: number;
	badgeCount: number;
	loading: boolean;
	customCSS: string;
	$webviewsContainer: DOMTokenList;
	$el: Electron.WebviewTag;

	// This is required because in main.js we access WebView.method as
	// webview[method].
	[key: string]: any;

	constructor(props: WebViewProps) {
		super();

		this.props = props;
		this.zoomFactor = 1.0;
		this.loading = true;
		this.badgeCount = 0;
		this.customCSS = ConfigUtil.getConfigItem('customCSS');
		this.$webviewsContainer = document.querySelector('#webviews-container').classList;
	}

	template(): string {
		return `<webview
					class="disabled"
					data-tab-id="${this.props.tabIndex}"
					src="${this.props.url}"
					${this.props.nodeIntegration ? 'nodeIntegration' : ''}
					disablewebsecurity
					${this.props.preload ? 'preload="js/preload.js"' : ''}
					partition="persist:webviewsession"
					name="${this.props.name}"
					webpreferences="allowRunningInsecureContent, javascript=yes">
				</webview>`;
	}

	init(): void {
		this.$el = this.generateNodeFromTemplate(this.template()) as Electron.WebviewTag;
		this.props.$root.append(this.$el);

		this.registerListeners();
	}

	registerListeners(): void {
		this.$el.addEventListener('new-window', event => {
			handleExternalLink.call(this, event);
		});

		if (shouldSilentWebview) {
			this.$el.addEventListener('dom-ready', () => {
				this.$el.setAudioMuted(true);
			});
		}

		this.$el.addEventListener('page-title-updated', event => {
			const { title } = event;
			this.badgeCount = this.getBadgeCount(title);
			this.props.onTitleChange();
		});

		this.$el.addEventListener('did-navigate-in-page', event => {
			const isSettingPage = event.url.includes('renderer/preference.html');
			if (isSettingPage) {
				return;
			}
			this.canGoBackButton();
		});

		this.$el.addEventListener('did-navigate', () => {
			this.canGoBackButton();
		});

		this.$el.addEventListener('page-favicon-updated', event => {
			const { favicons } = event;

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

		this.$el.addEventListener('dom-ready', () => {
			if (this.props.role === 'server') {
				this.$el.classList.add('onload');
			}
			this.loading = false;
			this.props.switchLoading(false, this.props.url);
			this.show();

			// Refocus text boxes after reload
			// Remove when upstream issue https://github.com/electron/electron/issues/14474 is fixed
			this.$el.blur();
			this.$el.focus();
		});

		this.$el.addEventListener('did-fail-load', event => {
			const { errorDescription } = event;
			const hasConnectivityErr = SystemUtil.connectivityERR.includes(errorDescription);
			if (hasConnectivityErr) {
				console.error('error', errorDescription);
				this.props.onNetworkError();
			}
		});

		this.$el.addEventListener('did-start-loading', () => {
			const isSettingPage = this.props.url.includes('renderer/preference.html');
			if (!isSettingPage) {
				this.props.switchLoading(true, this.props.url);
			}
			let userAgent = SystemUtil.getUserAgent();
			if (!userAgent) {
				SystemUtil.setUserAgent(this.$el.getUserAgent());
				userAgent = SystemUtil.getUserAgent();
			}
			this.$el.setUserAgent(userAgent);
		});

		this.$el.addEventListener('did-stop-loading', () => {
			this.props.switchLoading(false, this.props.url);
		});
	}

	getBadgeCount(title: string): number {
		const messageCountInTitle = (/\((\d+)\)/).exec(title);
		return messageCountInTitle ? Number(messageCountInTitle[1]) : 0;
	}

	show(): void {
		// Do not show WebView if another tab was selected and this tab should be in background.
		if (!this.props.isActive()) {
			return;
		}

		// To show or hide the loading indicator in the the active tab
		if (this.loading) {
			this.$webviewsContainer.remove('loaded');
		} else {
			this.$webviewsContainer.add('loaded');
		}

		this.$el.classList.remove('disabled');
		this.$el.classList.add('active');
		setTimeout(() => {
			if (this.props.role === 'server') {
				this.$el.classList.remove('onload');
			}
		}, 1000);
		this.focus();
		this.props.onTitleChange();
		// Injecting preload css in webview to override some css rules
		this.$el.insertCSS(fs.readFileSync(path.join(__dirname, '/../../css/preload.css'), 'utf8'));

		// get customCSS again from config util to avoid warning user again
		this.customCSS = ConfigUtil.getConfigItem('customCSS');
		if (this.customCSS) {
			if (!fs.existsSync(this.customCSS)) {
				this.customCSS = null;
				ConfigUtil.setConfigItem('customCSS', null);

				const errMsg = 'The custom css previously set is deleted!';
				dialog.showErrorBox('custom css file deleted!', errMsg);
				return;
			}

			this.$el.insertCSS(fs.readFileSync(path.resolve(__dirname, this.customCSS), 'utf8'));
		}
	}

	focus(): void {
		// focus Webview and it's contents when Window regain focus.
		const webContents = this.$el.getWebContents();
		// HACK: webContents.isFocused() seems to be true even without the element
		// being in focus. So, we check against `document.activeElement`.
		if (webContents && this.$el !== document.activeElement) {
			// HACK: Looks like blur needs to be called on the previously focused
			// element to transfer focus correctly, in Electron v3.0.10
			// See https://github.com/electron/electron/issues/15718
			(document.activeElement as HTMLElement).blur();
			this.$el.focus();
			webContents.focus();
		}
	}

	hide(): void {
		this.$el.classList.add('disabled');
		this.$el.classList.remove('active');
	}

	load(): void {
		if (this.$el) {
			this.show();
		} else {
			this.init();
		}
	}

	zoomIn(): void {
		this.zoomFactor += 0.1;
		this.$el.setZoomFactor(this.zoomFactor);
	}

	zoomOut(): void {
		this.zoomFactor -= 0.1;
		this.$el.setZoomFactor(this.zoomFactor);
	}

	zoomActualSize(): void {
		this.zoomFactor = 1.0;
		this.$el.setZoomFactor(this.zoomFactor);
	}

	logOut(): void {
		this.$el.executeJavaScript('logout()');
	}

	showShortcut(): void {
		this.$el.executeJavaScript('shortcut()');
	}

	openDevTools(): void {
		this.$el.openDevTools();
	}

	back(): void {
		if (this.$el.canGoBack()) {
			this.$el.goBack();
			this.focus();
		}
	}

	canGoBackButton(): void {
		const $backButton = document.querySelector('#actions-container #back-action');
		if (this.$el.canGoBack()) {
			$backButton.classList.remove('disable');
		} else {
			$backButton.classList.add('disable');
		}
	}

	forward(): void {
		if (this.$el.canGoForward()) {
			this.$el.goForward();
		}
	}

	reload(): void {
		this.hide();
		// Shows the loading indicator till the webview is reloaded
		this.$webviewsContainer.remove('loaded');
		this.loading = true;
		this.$el.reload();
	}

	send(channel: string, ...param: any[]): void {
		this.$el.send(channel, ...param);
	}
}

export = WebView;
