import { ipcRenderer } from 'electron';

import backoff = require('backoff');
import request = require('request');
import Logger = require('./logger-util');
import RequestUtil = require('./request-util');
import DomainUtil = require('./domain-util');

const logger = new Logger({
	file: 'domain-util.log',
	timestamp: true
});

class ReconnectUtil {
	// TODO: TypeScript - Figure out how to annotate webview
	// it should be WebView; maybe make it a generic so we can
	// pass the class from main.ts
	webview: any;
	url: string;
	alreadyReloaded: boolean;
	fibonacciBackoff: any;

	constructor(webview: any) {
		this.webview = webview;
		this.url = webview.props.url;
		this.alreadyReloaded = false;
		this.clearState();
	}

	clearState(): void {
		this.fibonacciBackoff = backoff.fibonacci({
			initialDelay: 5000,
			maxDelay: 300000
		});
	}

	async isOnline(): Promise<boolean> {
		return new Promise(resolve => {
			try {
				const ignoreCerts = DomainUtil.shouldIgnoreCerts(this.url);
				if (ignoreCerts === null) {
					return;
				}
				request(
					{
						url: `${this.url}/static/favicon.ico`,
						...RequestUtil.requestOptions(this.url, ignoreCerts)
					},
					(error: Error, response: any) => {
						const isValidResponse =
							!error && response.statusCode >= 200 && response.statusCode < 400;
						resolve(isValidResponse);
					}
				);
			} catch (err) {
				logger.log(err);
			}
		});
	}

	pollInternetAndReload(): void {
		this.fibonacciBackoff.backoff();
		this.fibonacciBackoff.on('ready', async () => {
			if (await this._checkAndReload()) {
				this.fibonacciBackoff.reset();
			} else {
				this.fibonacciBackoff.backoff();
			}
		});
	}

	async _checkAndReload(): Promise<boolean> {
		if (this.alreadyReloaded) {
			return true;
		}
		if (await this.isOnline()) {
			ipcRenderer.send('forward-message', 'reload-viewer');
			logger.log('You\'re back online.');
			return true;
		}
		logger.log('There is no internet connection, try checking network cables, modem and router.');
		const errMsgHolder = document.querySelector('#description');
		if (errMsgHolder) {
			errMsgHolder.innerHTML = `
						<div>Your internet connection doesn't seem to work properly!</div>
						<div>Verify that it works and then click try again.</div>`;
		}
		return false;
	}
}

export = ReconnectUtil;
