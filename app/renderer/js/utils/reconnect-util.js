const isOnline = require('is-online');
const Logger = require('./logger-util');

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

	_checkAndReload() {
		return new Promise(resolve => {
			if (!this.alreadyReloaded) { // eslint-disable-line no-negated-condition
				isOnline()
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
										<div>You internet connection does't seem to work properly!</div>
										</div>Verify that it works and then click try again.</div>`;
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
