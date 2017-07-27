'use strict';

const {app, dialog} = require('electron').remote;
const fs = require('fs');
const path = require('path');
const JsonDB = require('node-json-db');
const request = require('request');

let instance = null;

const defaultIconUrl = '../renderer/img/icon.png';

class DomainUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		// Migrate from old schema
		if (this.db.getData('/').domain) {
			this.addDomain({
				alias: 'Zulip',
				url: this.db.getData('/domain')
			});
			this.db.delete('/domain');
		}

		return instance;
	}

	getDomains() {
		this.reloadDB();
		if (this.db.getData('/').domains === undefined) {
			return [];
		} else {
			return this.db.getData('/domains');
		}
	}

	getDomain(index) {
		this.reloadDB();
		return this.db.getData(`/domains[${index}]`);
	}

	addDomain(server) {
		return new Promise(resolve => {
			if (server.icon) {
				this.saveServerIcon(server.icon).then(localIconUrl => {
					server.icon = localIconUrl;
					this.db.push('/domains[]', server, true);
					this.reloadDB();
					resolve();
				});
			} else {
				server.icon = defaultIconUrl;
				this.db.push('/domains[]', server, true);
				this.reloadDB();
				resolve();
			}
		});
	}

	removeDomains() {
		this.db.delete('/domains');
		this.reloadDB();
	}

	removeDomain(index) {
		this.db.delete(`/domains[${index}]`);
		this.reloadDB();
	}

	checkDomain(server) {
		let domain = server.url;
		server.icon = server.icon || defaultIconUrl;

		const hasPrefix = (domain.indexOf('http') === 0);
		if (!hasPrefix) {
			domain = (domain.indexOf('localhost:') >= 0) ? `http://${domain}` : `https://${domain}`;
		}

		const checkDomain = domain + '/static/audio/zulip.ogg';

		return new Promise((resolve, reject) => {
			request(checkDomain, (error, response) => {
				const certsError =
					['Error: self signed certificate',
						'Error: unable to verify the first certificate'
					];
				if (!error && response.statusCode !== 404) {
					// Correct
					this.getServerSettings(domain, server).then(serverSettings => {
						resolve(serverSettings);
					}, () => {
						resolve(server);
					});
				} else if (certsError.indexOf(error.toString()) >= 0) {
					dialog.showMessageBox({
						type: 'question',
						buttons: ['Yes', 'No'],
						defaultId: 0,
						message: `Do you trust certificate from ${domain}? \n ${error}`
					}, response => {
						if (response === 0) {
							this.getServerSettings(domain, server).then(serverSettings => {
								resolve(serverSettings);
							}, () => {
								resolve(server);
							});
						} else {
							reject('Untrusted Certificate.');
						}
					});
				} else {
					reject('Not a valid Zulip server');
				}
			});
		});
	}

	getServerSettings(domain, server) {
		const serverSettingsUrl = domain + '/api/v1/server_settings';
		return new Promise((resolve, reject) => {
			request(serverSettingsUrl, (error, response) => {
				if (!error && response.statusCode === 200) {
					const data = JSON.parse(response.body);
					if (data.hasOwnProperty('realm_icon') && data.realm_icon) {
						resolve({
							icon: (server.icon === defaultIconUrl) ? data.realm_uri + data.realm_icon : defaultIconUrl,
							url: data.realm_uri,
							alias: server.alias || data.realm_name
						});
					}
				} else {
					reject('Zulip server version < 1.6.');
				}
			});
		});
	}

	saveServerIcon(url) {
		// The save will always succeed. If url is invalid, downgrade to default icon.
		const dir = `${app.getPath('userData')}/server-icons`;

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		return new Promise(resolve => {
			const filePath = `${dir}/${new Date().getMilliseconds()}${path.extname(url).split('?')[0]}`;
			const file = fs.createWriteStream(filePath);
			try {
				request(url).on('response', response => {
					response.on('error', err => {
						console.log(err);
						resolve(defaultIconUrl);
					});
					response.pipe(file).on('finish', () => {
						resolve(filePath);
					});
				}).on('error', err => {
					console.log(err);
					resolve(defaultIconUrl);
				});
			} catch (err) {
				console.log(err);
				resolve(defaultIconUrl);
			}
		});
	}

	reloadDB() {
		this.db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
	}
}

module.exports = new DomainUtil();
