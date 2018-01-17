'use strict';

const { app, dialog } = require('electron').remote;
const fs = require('fs');
const path = require('path');
const JsonDB = require('node-json-db');
const request = require('./request-util');
const Logger = require('./logger-util');

const logger = new Logger({
	file: `domain-util.log`,
	timestamp: true
});

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
			request(checkDomain)
			.then(() => {
				this.getServerSettings(domain).then(serverSettings => {
					resolve(serverSettings);
				}, () => {
					resolve(serverConf);
				});
			})
			.catch(err => {
				logger.log(`Error checking zulip server '${domain}' error: `);
				logger.log(err);
				const invalidZulipServerError = `${domain} does not appear to be a valid Zulip server. Make sure that \
				\n(1) you can connect to that URL in a web browser and \n (2) if you need a proxy to connect to the Internet, that you've configured your proxy in the Network settings \n (3) its a zulip server`;
				reject(invalidZulipServerError);
			});
		});
	}

	getServerSettings(domain) {
		const serverSettingsUrl = domain + '/api/v1/server_settings';
		return new Promise((resolve, reject) => {
			request(serverSettingsUrl)
			.then(response => {
				const data = JSON.parse(response.body);
				if (data.hasOwnProperty('realm_icon') && data.realm_icon) {
					resolve({
						// Some Zulip Servers use absolute URL for server icon whereas others use relative URL
						// Following check handles both the cases
						icon: data.realm_icon.startsWith('/') ? data.realm_uri + data.realm_icon : data.realm_icon,
						url: data.realm_uri,
						alias: data.realm_name
					});
				}
			})
			.catch(err => {
				logger.log(err);
				reject('Zulip server version < 1.6.');
			});
		});
	}

	saveServerIcon(url) {
		// The save will always succeed. If url is invalid, downgrade to default icon.
		return new Promise(resolve => {
			const filePath = this.generateFilePath(url);

			request(url)
			.then(response => {
				fs.writeFileSync(filePath, response.body);
			})
			.catch(err => {
				logger.log(err);
				resolve(defaultIconUrl);
			});
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
		const domainJsonPath = path.join(app.getPath('userData'), '/domain.json');
		try {
			const file = fs.readFileSync(domainJsonPath, 'utf8');
			JSON.parse(file);
		} catch (err) {
			if (fs.existsSync(domainJsonPath)) {
				fs.unlinkSync(domainJsonPath);
				dialog.showErrorBox(
					'Error saving new organization',
					'There seems to be error while saving new organization, ' +
					'you may have to re-add your previous organizations back.'
				);
				logger.error('Error while JSON parsing domain.json: ');
				logger.error(err);
			}
		}
		this.db = new JsonDB(domainJsonPath, true, true);
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
