const isOnline = require('is-online');
const request = require('request');
const Logger = require('./logger-util');

const DomainUtil = require('./domain-util');
const RequestUtil = require('./request-util');
const ConfigUtil = require('./config-util');

const logger = new Logger({
	file: `domain-util.log`,
	timestamp: true
});

class ReconnectUtil {
	constructor(serverManagerView) {
		this.serverManagerView = serverManagerView;
		this.alreadyReloaded = false;
	}

	clearState() {
		this.alreadyReloaded = false;
	}

	pollInternetAndReload() {
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

	_isDomainReachable(domain) {
		return new Promise(resolve => {
			try {
				request(
					{
						url: `${domain}/static/favicon.ico`,
						...RequestUtil.requestOptions(domain)
					},
					(error, response) => {
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

	_isOnlineOrCanReachDomain() {
		return new Promise(async resolve => {
			const proxyEnabled =
				ConfigUtil.getConfigItem('useManualProxy') ||
				ConfigUtil.getConfigItem('useSystemProxy');

			let online = await isOnline();

			if (online) {
				// If is-online returns true, we probably are online.
				// FIXME commented to reach favicon test code
				// resolve(true);
			} else if (proxyEnabled !== true) {
				// If no proxy is enabled and is-online returns false, we probably are offline.
				// FIXME commented to reach favicon test code
				// resolve(false);
			}

			const domains = DomainUtil.getDomains().map(domain => domain.url);
			if (domains.length === 0) {
				// No domain, cannot test.
				resolve(false);
			}

			// Start immediately the requests, resolve in race.
			const checkReachableDomains = domains.map(domain => this._isDomainReachable(domain));
			online = await Promise.race(checkReachableDomains);
			resolve(online);
		});
	}

	_checkAndReload() {
		return new Promise(resolve => {
			if (this.alreadyReloaded === false) {
				this._isOnlineOrCanReachDomain()
					.then(online => {
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

module.exports = ReconnectUtil;
