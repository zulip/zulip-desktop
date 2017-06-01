'use strict';

const {app} = require('electron').remote;
const JsonDB = require('node-json-db');
const request = require('request');

const defaultIconUrl = __dirname + '../../../../resources/icon.png';
class DomainUtil {
	constructor() {
		this.db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
		// Migrate from old schema
		if (this.db.getData('/').domain) {
			this.addDomain({
				alias: 'Zulip',
				url: this.db.getData('/domain')
			});
			this.db.delete('/domain');
		}
	}

	getDomains() {
		if (this.db.getData('/').domains === undefined) {
			return [];
		} else {
			return this.db.getData('/domains');
		}
	}

	getDomain(index) {
		return this.db.getData(`/domains[${index}]`);
	}

	addDomain(server) {
		this.db.push('/domains[]', server, true);
	}

	removeDomains() {
		this.db.delete('/domains');
	}

	removeDomain(index) {
		this.db.delete(`/domains[${index}]`);
	}

	checkDomain(domain) {
		const hasPrefix = (domain.indexOf('http') === 0);
		if (!hasPrefix) {
			domain = (domain.indexOf('localhost:') >= 0) ? `http://${domain}` : `https://${domain}`;
		}
		let server = {};
		const serverSettingsUrl = domain + '/api/v1/server_settings';

		return new Promise((resolve, reject) => {
			request(serverSettingsUrl, (error, response) => {
				const data = JSON.parse(response.body);
				if (data.hasOwnProperty('realm_icon') && data.realm_icon) {
					server.icon = (domain + data.realm_icon) || defaultIconUrl;
					server.url = data.realm_uri;
					server.alias = data.realm_name;
				}
				if (!error && response.statusCode !== 404) {
					resolve(server);
				} else if (error.toString().indexOf('Error: self signed certificate') >= 0) {
					if (window.confirm(`Do you trust certificate from ${domain}?`)) {
						resolve(server);
					} else {
						reject('Untrusted Certificate.');
					}
				} else {
					reject('Not a valid Zulip server');
				}
			});
		});
	}
}

module.exports = DomainUtil;
