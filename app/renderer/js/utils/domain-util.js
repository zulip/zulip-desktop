'use strict';

const {app} = require('electron').remote;
const JsonDB = require('node-json-db');
const request = require('request');

const defaultIconUrl = 'https://chat.zulip.org/static/images/logo/zulip-icon-128x128.271d0f6a0ca2.png';
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
		server.icon = server.icon || defaultIconUrl;
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

		const checkDomain = domain + '/static/audio/zulip.ogg';

		return new Promise((resolve, reject) => {
			request(checkDomain, (error, response) => {
				if (!error && response.statusCode !== 404) {
					resolve(domain);
				} else if (error.toString().indexOf('Error: self signed certificate') >= 0) {
					if (window.confirm(`Do you trust certificate from ${domain}?`)) {
						resolve(domain);
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
