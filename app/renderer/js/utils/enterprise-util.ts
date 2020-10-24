import fs from 'fs';
import path from 'path';

import Logger from './logger-util';

const logger = new Logger({
	file: 'enterprise-util.log',
	timestamp: true
});

// TODO: replace enterpriseSettings type with an interface once settings are final
let enterpriseSettings: Record<string, unknown>;
let configFile: boolean;

reloadDB();

function reloadDB(): void {
	let enterpriseFile = '/etc/zulip-desktop-config/global_config.json';
	if (process.platform === 'win32') {
		enterpriseFile = 'C:\\Program Files\\Zulip-Desktop-Config\\global_config.json';
	}

	enterpriseFile = path.resolve(enterpriseFile);
	if (fs.existsSync(enterpriseFile)) {
		configFile = true;
		try {
			const file = fs.readFileSync(enterpriseFile, 'utf8');
			enterpriseSettings = JSON.parse(file);
		} catch (error: unknown) {
			logger.log('Error while JSON parsing global_config.json: ');
			logger.log(error);
		}
	} else {
		configFile = false;
	}
}

export function hasConfigFile(): boolean {
	return configFile;
}

export function getConfigItem(key: string, defaultValue?: unknown): any {
	reloadDB();
	if (!configFile) {
		return defaultValue;
	}

	if (defaultValue === undefined) {
		defaultValue = null;
	}

	return configItemExists(key) ? enterpriseSettings[key] : defaultValue;
}

export function configItemExists(key: string): boolean {
	reloadDB();
	if (!configFile) {
		return false;
	}

	return (enterpriseSettings[key] !== undefined);
}

export function isPresetOrg(url: string): boolean {
	if (!configFile || !configItemExists('presetOrganizations')) {
		return false;
	}

	const presetOrgs = enterpriseSettings.presetOrganizations;
	if (!Array.isArray(presetOrgs)) {
		throw new TypeError('Expected array for presetOrgs');
	}

	for (const org of presetOrgs) {
		if (url.includes(org)) {
			return true;
		}
	}

	return false;
}
