'use strict';

const {app} = require('electron').remote;
const JsonDB = require('node-json-db');
const request = require('request');

class DomainUtil {
	constructor() {
		this.db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
		if (!this.getDomains()) {
			this.db.push('/domains', []);
		}
	}

	getDomains() {
		return this.db.getData('/domains');
	}

	getDomain(index) {
		return this.db.getData(`/domains[${index}]`);
	}

	addDomain(server) {
		server.icon = server.icon || 'https://chat.zulip.org/static/images/logo/zulip-icon-128x128.271d0f6a0ca2.png';
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
