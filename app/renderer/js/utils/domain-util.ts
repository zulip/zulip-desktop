import {remote, ipcRenderer} from 'electron';
import fs from 'fs';
import path from 'path';

import {JsonDB} from 'node-json-db';

import * as Messages from '../../../resources/messages';

import * as EnterpriseUtil from './enterprise-util';
import Logger from './logger-util';

const {app, dialog} = remote;

export interface ServerConf {
	url: string;
	alias?: string;
	icon?: string;
	loggedIn?: boolean;
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

export async function checkDomain(domain: string, silent = false): Promise<ServerConf> {
	if (!silent && duplicateDomain(domain)) {
		// Do not check duplicate in silent mode
		throw new Error('This server has been added.');
	}

	domain = formatUrl(domain);

	try {
		return await getServerSettings(domain);
	} catch {
		throw new Error(Messages.invalidZulipServerError(domain));
	}
}

async function getServerSettings(domain: string): Promise<ServerConf> {
	return ipcRenderer.invoke('get-server-settings', domain);
}

export async function saveServerIcon(server: ServerConf): Promise<string> {
	return ipcRenderer.invoke('save-server-icon', server.icon);
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
	} catch (error: unknown) {
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
	} catch (error: unknown) {
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

export function formatUrl(domain: string): string {
	if (domain.startsWith('http://') || domain.startsWith('https://')) {
		return domain;
	}

	if (domain.startsWith('localhost:')) {
		return `http://${domain}`;
	}

	return `https://${domain}`;
}
