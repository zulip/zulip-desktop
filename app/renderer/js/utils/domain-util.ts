import {JsonDB} from 'node-json-db';

import escape from 'escape-html';
import request from 'request';
import fs from 'fs';
import path from 'path';
import Logger from './logger-util';
import {remote} from 'electron';

import * as RequestUtil from './request-util';
import * as EnterpriseUtil from './enterprise-util';
import * as Messages from '../../../resources/messages';

const {app, dialog} = remote;

export interface ServerConf {
	url: string;
	alias?: string;
	icon?: string;
}

const logger = new Logger({
	file: 'domain-util.log',
	timestamp: true
});

const defaultIconUrl = '../renderer/img/icon.png';

let db: JsonDB;

reloadDB();
// Migrate from old schema
if (db.getData('/').domain) {
	(async () => {
		await addDomain({
			alias: 'Zulip',
			url: db.getData('/domain')
		});
		db.delete('/domain');
	})();
}

export function getDomains(): ServerConf[] {
	reloadDB();
	if (db.getData('/').domains === undefined) {
		return [];
	}

	return db.getData('/domains');
}

export function getDomain(index: number): ServerConf {
	reloadDB();
	return db.getData(`/domains[${index}]`);
}

export function updateDomain(index: number, server: ServerConf): void {
	reloadDB();
	db.push(`/domains[${index}]`, server, true);
}

export async function addDomain(server: ServerConf): Promise<void> {
	if (server.icon) {
		const localIconUrl = await saveServerIcon(server);
		server.icon = localIconUrl;
		db.push('/domains[]', server, true);
		reloadDB();
	} else {
		server.icon = defaultIconUrl;
		db.push('/domains[]', server, true);
		reloadDB();
	}
}

export function removeDomains(): void {
	db.delete('/domains');
	reloadDB();
}

export function removeDomain(index: number): boolean {
	if (EnterpriseUtil.isPresetOrg(getDomain(index).url)) {
		return false;
	}

	db.delete(`/domains[${index}]`);
	reloadDB();
	return true;
}

// Check if domain is already added
export function duplicateDomain(domain: string): boolean {
	domain = formatUrl(domain);
	return getDomains().some(server => server.url === domain);
}

async function checkCertError(domain: string, serverConf: ServerConf, error: any, silent: boolean): Promise<ServerConf> {
	if (silent) {
		// Since getting server settings has already failed
		return serverConf;
	}

	// Report error to sentry to get idea of possible certificate errors
	// users get when adding the servers
	logger.reportSentry(error);
	const certErrorMessage = Messages.certErrorMessage(domain, error);
	const certErrorDetail = Messages.certErrorDetail();

	await dialog.showMessageBox({
		type: 'error',
		buttons: ['OK'],
		message: certErrorMessage,
		detail: certErrorDetail
	});
	throw new Error('Untrusted certificate.');
}

export async function checkDomain(domain: string, silent = false): Promise<ServerConf> {
	if (!silent && duplicateDomain(domain)) {
		// Do not check duplicate in silent mode
		throw new Error('This server has been added.');
	}

	domain = formatUrl(domain);

	const serverConf = {
		icon: defaultIconUrl,
		url: domain,
		alias: domain
	};

	try {
		return await getServerSettings(domain);
	} catch (error_) {
		// Make sure that error is an error or string not undefined
		// so validation does not throw error.
		const error = error_ || '';

		const certsError = error.toString().includes('certificate');
		if (certsError) {
			const result = await checkCertError(domain, serverConf, error, silent);
			return result;
		}

		throw new Error(Messages.invalidZulipServerError(domain));
	}
}

async function getServerSettings(domain: string): Promise<ServerConf> {
	const serverSettingsOptions = {
		url: domain + '/api/v1/server_settings',
		...RequestUtil.requestOptions(domain)
	};

	return new Promise((resolve, reject) => {
		request(serverSettingsOptions, (error: Error, response: request.Response) => {
			if (!error && response.statusCode === 200) {
				const {realm_name, realm_uri, realm_icon} = JSON.parse(response.body);
				if (
					typeof realm_name === 'string' &&
					typeof realm_uri === 'string' &&
					typeof realm_icon === 'string'
				) {
					resolve({
						// Some Zulip Servers use absolute URL for server icon whereas others use relative URL
						// Following check handles both the cases
						icon: realm_icon.startsWith('/') ? realm_uri + realm_icon : realm_icon,
						url: realm_uri,
						alias: escape(realm_name)
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

export async function saveServerIcon(server: ServerConf): Promise<string> {
	const url = server.icon;
	const domain = server.url;

	const serverIconOptions = {
		url,
		...RequestUtil.requestOptions(domain)
	};

	// The save will always succeed. If url is invalid, downgrade to default icon.
	return new Promise(resolve => {
		const filePath = generateFilePath(url);
		const file = fs.createWriteStream(filePath);
		try {
			request(serverIconOptions).on('response', (response: request.Response) => {
				response.on('error', (err: Error) => {
					logger.log('Could not get server icon.');
					logger.log(err);
					logger.reportSentry(err);
					resolve(defaultIconUrl);
				});
				response.pipe(file).on('finish', () => {
					resolve(filePath);
				});
			}).on('error', (err: Error) => {
				logger.log('Could not get server icon.');
				logger.log(err);
				logger.reportSentry(err);
				resolve(defaultIconUrl);
			});
		} catch (error) {
			logger.log('Could not get server icon.');
			logger.log(error);
			logger.reportSentry(error);
			resolve(defaultIconUrl);
		}
	});
}

export async function updateSavedServer(url: string, index: number): Promise<void> {
	// Does not promise successful update
	const oldIcon = getDomain(index).icon;
	try {
		const newServerConf = await checkDomain(url, true);
		const localIconUrl = await saveServerIcon(newServerConf);
		if (!oldIcon || localIconUrl !== '../renderer/img/icon.png') {
			newServerConf.icon = localIconUrl;
			updateDomain(index, newServerConf);
			reloadDB();
		}
	} catch (error) {
		logger.log('Could not update server icon.');
		logger.log(error);
		logger.reportSentry(error);
	}
}

function reloadDB(): void {
	const domainJsonPath = path.join(app.getPath('userData'), 'config/domain.json');
	try {
		const file = fs.readFileSync(domainJsonPath, 'utf8');
		JSON.parse(file);
	} catch (error) {
		if (fs.existsSync(domainJsonPath)) {
			fs.unlinkSync(domainJsonPath);
			dialog.showErrorBox(
				'Error saving new organization',
				'There seems to be error while saving new organization, ' +
				'you may have to re-add your previous organizations back.'
			);
			logger.error('Error while JSON parsing domain.json: ');
			logger.error(error);
			logger.reportSentry(error);
		}
	}

	db = new JsonDB(domainJsonPath, true, true);
}

function generateFilePath(url: string): string {
	const dir = `${app.getPath('userData')}/server-icons`;
	const extension = path.extname(url).split('?')[0];

	let hash = 5381;
	let {length} = url;

	while (length) {
		hash = (hash * 33) ^ url.charCodeAt(--length);
	}

	// Create 'server-icons' directory if not existed
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	return `${dir}/${hash >>> 0}${extension}`;
}

export function formatUrl(domain: string): string {
	if (domain.startsWith('http://') || domain.startsWith('https://')) {
		return domain;
	}

	if (domain.startsWith('localhost:')) {
		return `http://${domain}`;
	}

	return `https://${domain}`;
}
