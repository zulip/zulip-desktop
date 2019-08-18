'use strict';
import escape = require('escape-html');
import request = require('request');
import fs = require('fs');
import path = require('path');
import Logger = require('./logger-util');
import electron = require('electron');

import LevelDBUtil = require('./leveldb-util');
import RequestUtil = require('./request-util');
import EnterpriseUtil = require('./enterprise-util');
import Messages = require('../../../resources/messages');

const { app, dialog } = electron.remote;

const logger = new Logger({
	file: `domain-util.log`,
	timestamp: true
});

const defaultIconUrl = '../renderer/img/icon.png';

class DomainUtil {
	domains: Domain[];
	constructor() {
		this.domains = [];
		this.reloadDB();
	}

	async reloadDB(): Promise<void> {
		if (process.type === 'renderer') {
			this.domains = await LevelDBUtil.initDomainUtil();
		}
	}

	getDomains(): Domain[] {
		return this.domains;
	}

	getDomain(index: number): Domain {
		return this.domains[index];
	}

	updateDomain(index: number, server: Domain): void {
		this.domains[index] = server;
		LevelDBUtil.updateDomains(this.domains);
	}

	addDomain(server: Domain): Promise<void> {
		const { ignoreCerts } = server;
		return new Promise(resolve => {
			if (server.icon) {
				this.saveServerIcon(server, ignoreCerts).then(localIconUrl => {
					server.icon = localIconUrl;
					this.domains.push(server);
					LevelDBUtil.updateDomains(this.domains).then(res => {
						resolve();
					});
				});
			} else {
				server.icon = defaultIconUrl;
				this.domains.push(server);
				LevelDBUtil.updateDomains(this.domains).then(res => {
					resolve();
				});
			}
		});
	}

	removeDomains(): void {
		this.domains = [];
		LevelDBUtil.updateDomains(this.domains);
	}

	removeDomain(index: number): boolean {
		if (EnterpriseUtil.isPresetOrg(this.getDomain(index).url)) {
			return false;
		}
		this.domains.splice(index, 1);
		LevelDBUtil.updateDomains(this.domains);
		return true;
	}

	// Check if domain is already added
	duplicateDomain(domain: any): boolean {
		domain = this.formatUrl(domain);
		const servers = this.getDomains();
		for (const server of servers) {
			if (server.url === domain) {
				return true;
			}
		}
		return false;
	}

	async checkCertError(domain: any, serverConf: any, error: string, silent: boolean): Promise<string | object> {
		if (silent) {
			// since getting server settings has already failed
			return serverConf;
		} else {
			// Report error to sentry to get idea of possible certificate errors
			// users get when adding the servers
			logger.reportSentry(new Error(error).toString());
			const certErrorMessage = Messages.certErrorMessage(domain, error);
			const certErrorDetail = Messages.certErrorDetail();

			const response = await (dialog.showMessageBox({
				type: 'warning',
				buttons: ['Yes', 'No'],
				defaultId: 1,
				message: certErrorMessage,
				detail: certErrorDetail
			}) as any); // TODO: TypeScript - Figure this out
			if (response === 0) {
				// set ignoreCerts parameter to true in case user responds with yes
				serverConf.ignoreCerts = true;
				try {
					return await this.getServerSettings(domain, serverConf.ignoreCerts);
				} catch (_) {
					if (error === Messages.noOrgsError(domain)) {
						throw new Error(error);
					}
					return serverConf;
				}
			} else {
				throw new Error('Untrusted certificate.');
			}
		}
	}

	// ignoreCerts parameter helps in fetching server icon and
	// other server details when user chooses to ignore certificate warnings
	async checkDomain(domain: any, ignoreCerts = false, silent = false): Promise<any> {
		if (!silent && this.duplicateDomain(domain)) {
			// Do not check duplicate in silent mode
			throw new Error('This server has been added.');
		}

		domain = this.formatUrl(domain);

		const serverConf = {
			icon: defaultIconUrl,
			url: domain,
			alias: domain,
			ignoreCerts
		};

		try {
			return await this.getServerSettings(domain, serverConf.ignoreCerts);
		} catch (err) {
			// If the domain contains following strings we just bypass the server
			const whitelistDomains = [
				'zulipdev.org'
			];

			// make sure that error is an error or string not undefined
			// so validation does not throw error.
			const error = err || '';

			const certsError = error.toString().includes('certificate');
			if (domain.indexOf(whitelistDomains) >= 0 || certsError) {
				return this.checkCertError(domain, serverConf, error, silent);
			} else {
				throw Messages.invalidZulipServerError(domain);
			}
		}
	}

	getServerSettings(domain: any, ignoreCerts = false): Promise<object | string> {
		const serverSettingsOptions = {
			url: domain + '/api/v1/server_settings',
			...RequestUtil.requestOptions(domain, ignoreCerts)
		};

		return new Promise((resolve, reject) => {
			request(serverSettingsOptions, (error: string, response: any) => {
				if (!error && response.statusCode === 200) {
					const data = JSON.parse(response.body);
					if (data.hasOwnProperty('realm_icon') && data.realm_icon) {
						resolve({
							// Some Zulip Servers use absolute URL for server icon whereas others use relative URL
							// Following check handles both the cases
							icon: data.realm_icon.startsWith('/') ? data.realm_uri + data.realm_icon : data.realm_icon,
							url: data.realm_uri,
							alias: escape(data.realm_name),
							ignoreCerts
						});
					} else {
						reject(Messages.noOrgsError(domain));
					}
				} else {
					reject(response);
				}
			});
		});
	}

	saveServerIcon(server: any, ignoreCerts = false): Promise<string> {
		const url = server.icon;
		const domain = server.url;

		const serverIconOptions = {
			url,
			...RequestUtil.requestOptions(domain, ignoreCerts)
		};

		// The save will always succeed. If url is invalid, downgrade to default icon.
		return new Promise(resolve => {
			const filePath = this.generateFilePath(url);
			const file = fs.createWriteStream(filePath);
			try {
				request(serverIconOptions).on('response', (response: any) => {
					response.on('error', (err: string) => {
						logger.log('Could not get server icon.');
						logger.log(err);
						logger.reportSentry(err);
						resolve(defaultIconUrl);
					});
					response.pipe(file).on('finish', () => {
						resolve(filePath);
					});
				}).on('error', (err: string) => {
					logger.log('Could not get server icon.');
					logger.log(err);
					logger.reportSentry(err);
					resolve(defaultIconUrl);
				});
			} catch (err) {
				logger.log('Could not get server icon.');
				logger.log(err);
				logger.reportSentry(err);
				resolve(defaultIconUrl);
			}
		});
	}

	updateSavedServer(url: string, index: number): void {
		// Does not promise successful update
		const oldIcon = this.getDomain(index).icon;
		const { ignoreCerts } = this.getDomain(index);
		this.checkDomain(url, ignoreCerts, true).then(newServerConf => {
			this.saveServerIcon(newServerConf, ignoreCerts).then(localIconUrl => {
				if (!oldIcon || localIconUrl !== '../renderer/img/icon.png') {
					newServerConf.icon = localIconUrl;
					this.updateDomain(index, newServerConf);
				}
			});
		});
	}

	generateFilePath(url: string): string {
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

	formatUrl(domain: any): string {
		const hasPrefix = (domain.indexOf('http') === 0);
		if (hasPrefix) {
			return domain;
		} else {
			return (domain.indexOf('localhost:') >= 0) ? `http://${domain}` : `https://${domain}`;
		}
	}

	updateDomainUtil(domains: Domain[]): void {
		this.domains = domains;
	}
}

export = new DomainUtil();
