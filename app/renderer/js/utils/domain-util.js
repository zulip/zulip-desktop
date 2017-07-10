'use strict';

const {app} = require('electron').remote;
const JsonDB = require('node-json-db');
const request = require('request');
const fs = require('fs');
const path = require('path');

let instance = null;

const defaultIconUrl = __dirname + '../../../img/icon.png';

class DomainUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.db = new JsonDB(app.getPath('userData') + '/domain.json', true, true);
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
		return new Promise((res, rej) => {
			if (server.icon) {
				this.saveServerIcon(server.icon).then((localIconUrl) => {
					server.icon = localIconUrl;
					this.db.push('/domains[]', server, true);
					res();
				});
			} else {
				server.icon = defaultIconUrl;
				this.db.push('/domains[]', server, true);
				res();
			}
		});
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

	saveServerIcon(url) {
		// The save will always succeed. If url is invalid, downgrade to default icon.
		const dir = `${app.getPath('userData')}/server-icons`;

		if (!fs.existsSync(dir)){
			fs.mkdirSync(dir);
		}

		return new Promise((res, rej) => {
			const filePath = `${dir}/${new Date().getMilliseconds()}${path.extname(url)}`;
			let file = fs.createWriteStream(filePath);
			console.log(filePath);
			try {
				let req = request(url);
				req.on('response', response => {
					response.pipe(file);
					res(filePath);
				});
			} catch (error) {
				console.log(error);
				res(defaultIconUrl);
			}
		});
	}
}

module.exports = new DomainUtil();
