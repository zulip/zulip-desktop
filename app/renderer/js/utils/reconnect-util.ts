import { ipcRenderer } from 'electron';

import request = require('request');
import Logger = require('./logger-util');
import RequestUtil = require('./request-util');
import DomainUtil = require('./domain-util');

const logger = new Logger({
	file: `domain-util.log`,
	timestamp: true
});

class ReconnectUtil {
	// TODO: TypeScript - Figure out how to annotate webview
	// it should be WebView; maybe make it a generic so we can
	// pass the class from main.ts
	webview: any;
	url: string;
	alreadyReloaded: boolean;

	constructor(webview: any) {
		this.webview = webview;
		this.url = webview.props.url;
		this.alreadyReloaded = false;
	}

	clearState(): void {
		this.alreadyReloaded = false;
	}

	isOnline(): Promise<boolean> {
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
		const pollInterval = setInterval(() => {
			this._checkAndReload()
				.then(status => {
					if (status) {
						this.alreadyReloaded = true;
						clearInterval(pollInterval);
					}
				});
		}, 1500);
	}

	// TODO: Make this a async function
	_checkAndReload(): Promise<boolean> {
		return new Promise(resolve => {
			if (!this.alreadyReloaded) { // eslint-disable-line no-negated-condition
				this.isOnline()
					.then((online: boolean) => {
						if (online) {
							if (!this.alreadyReloaded) {
								ipcRenderer.send('forward-message', 'reload-viewer');
							}
							logger.log('You\'re back online.');
							return resolve(true);
						}

						logger.log('There is no internet connection, try checking network cables, modem and router.');
						const errMsgHolder = document.querySelector('#description');
						if (errMsgHolder) {
							errMsgHolder.innerHTML = `
										<div>Your internet connection doesn't seem to work properly!</div>
										<div>Verify that it works and then click try again.</div>`;
						}
						return resolve(false);
					});
			} else {
				return resolve(true);
			}
		});
	}
}

export = ReconnectUtil;
