import { ipcRenderer } from 'electron';

import backoff = require('backoff');
import request = require('request');
import Logger = require('./logger-util');
import RequestUtil = require('./request-util');
import DomainUtil = require('./domain-util');

const logger = new Logger({
	file: `domain-util.log`,
	timestamp: true
});

class ReconnectUtil {
	url: string;
	alreadyReloaded: boolean;
	fibonacciBackoff: any;

	constructor(url: string) {
		this.url = url;
		this.alreadyReloaded = false;
		this.clearState();
	}

	clearState(): void {
		this.fibonacciBackoff = backoff.fibonacci({
			initialDelay: 5000,
			maxDelay: 300000
		});
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
		this.fibonacciBackoff.backoff();
		this.fibonacciBackoff.on('ready', () => {
			this._checkAndReload().then(status => {
				if (status) {
					this.fibonacciBackoff.reset();
				} else {
					this.fibonacciBackoff.backoff();
				}
			});
		});
	}

	// TODO: Make this a async function
	_checkAndReload(): Promise<boolean> {
		return new Promise(resolve => {
			if (!this.alreadyReloaded) { // eslint-disable-line no-negated-condition
				this.isOnline()
					.then((online: boolean) => {
						if (online) {
							ipcRenderer.send('forward-message', 'reload-viewer');
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
