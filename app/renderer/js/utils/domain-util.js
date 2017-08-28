'use strict';

const { app, dialog } = require('electron').remote;
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

	updateDomain(index, server) {
		this.reloadDB();
		this.db.push(`/domains[${index}]`, server, true);
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

	// Check if domain is already added
	duplicateDomain(domain) {
		domain = this.formatUrl(domain);
		const servers = this.getDomains();
		for (const i in servers) {
			if (servers[i].url === domain) {
				return true;
			}
		}
		return false;
	}

	checkDomain(domain, silent = false) {
		if (!silent && this.duplicateDomain(domain)) {
			// Do not check duplicate in silent mode
			alert('This server has been added.');
			return;
		}

		domain = this.formatUrl(domain);

		const checkDomain = domain + '/static/audio/zulip.ogg';

		const serverConf = {
			icon: defaultIconUrl,
			url: domain,
			alias: domain
		};

		return new Promise((resolve, reject) => {
			request(checkDomain, (error, response) => {
				const certsError =
					['Error: self signed certificate',
						'Error: unable to verify the first certificate'
					];
				if (!error && response.statusCode !== 404) {
					// Correct
					this.getServerSettings(domain).then(serverSettings => {
						resolve(serverSettings);
					}, () => {
						resolve(serverConf);
					});
				} else if (certsError.indexOf(error.toString()) >= 0) {
					if (silent) {
						this.getServerSettings(domain).then(serverSettings => {
							resolve(serverSettings);
						}, () => {
							resolve(serverConf);
						});
					} else {
						const certErrorMessage = `Do you trust certificate from ${domain}? \n ${error}`;
						const certErrorDetail = `The server you're connecting to is either someone impersonating the Zulip server you entered, or the server you're trying to connect to is configured in an insecure way.
						\n Unless you have a good reason to believe otherwise, you should not proceed.
						\n You can click here if you'd like to proceed with the connection.`;

						dialog.showMessageBox({
							type: 'warning',
							buttons: ['Yes', 'No'],
							defaultId: 0,
							message: certErrorMessage,
							detail: certErrorDetail
						}, response => {
							if (response === 0) {
								this.getServerSettings(domain).then(serverSettings => {
									resolve(serverSettings);
								}, () => {
									resolve(serverConf);
								});
							} else {
								reject('Untrusted Certificate.');
							}
						});
					}
				} else {
					reject('Not a valid Zulip server');
				}
			});
		});
	}

	getServerSettings(domain) {
		const serverSettingsUrl = domain + '/api/v1/server_settings';
		return new Promise((resolve, reject) => {
			request(serverSettingsUrl, (error, response) => {
				if (!error && response.statusCode === 200) {
					const data = JSON.parse(response.body);
					if (data.hasOwnProperty('realm_icon') && data.realm_icon) {
						resolve({
							icon: data.realm_uri + data.realm_icon,
							url: data.realm_uri,
							alias: data.realm_name
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
		return new Promise(resolve => {
			const filePath = this.generateFilePath(url);
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

	updateSavedServer(url, index) {
		// Does not promise successful update
		this.checkDomain(url, true).then(newServerConf => {
			this.saveServerIcon(newServerConf.icon).then(localIconUrl => {
				newServerConf.icon = localIconUrl;
				this.updateDomain(index, newServerConf);
				this.reloadDB();
			});
		});
	}

	reloadDB() {
		this.db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
	}

	generateFilePath(url) {
		const dir = `${app.getPath('userData')}/server-icons`;
		const extension = path.extname(url).split('?')[0];

		let hash = 5381;
		let len = url.length;

		while (len) {
			hash = (hash * 33) ^ url.charCodeAt(--len);
		}

		// Create 'server-icons' directory if not existed
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		return `${dir}/${hash >>> 0}${extension}`;
	}

	formatUrl(domain) {
		const hasPrefix = (domain.indexOf('http') === 0);
		if (hasPrefix) {
			return domain;
		} else {
			return (domain.indexOf('localhost:') >= 0) ? `http://${domain}` : `https://${domain}`;
		}
	}
}

module.exports = new DomainUtil();
