import isOnline = require('is-online');
import Logger = require('./logger-util');

const logger = new Logger({
	file: `domain-util.log`,
	timestamp: true
});

class ReconnectUtil {
	// TODO: TypeScript - Figure out how to annotate serverManagerView
	// it should be ServerManagerView; maybe make it a generic so we can
	// pass the class from main.js
	serverManagerView: any;
	alreadyReloaded: boolean;

	constructor(serverManagerView: any) {
		this.serverManagerView = serverManagerView;
		this.alreadyReloaded = false;
	}

	clearState(): void {
		this.alreadyReloaded = false;
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
				isOnline()
					.then((online: boolean) => {
						if (online) {
							if (!this.alreadyReloaded) {
								this.serverManagerView.reloadView();
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
