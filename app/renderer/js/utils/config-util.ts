import electron from 'electron';
import fs from 'fs';
import path from 'path';

import {JsonDB} from 'node-json-db';

import * as EnterpriseUtil from './enterprise-util';
import Logger from './logger-util';

const logger = new Logger({
	file: 'config-util.log',
	timestamp: true
});

let dialog: Electron.Dialog = null;
let app: Electron.App = null;

/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
	const {remote} = electron;
	dialog = remote.dialog;
	app = remote.app;
} else {
	dialog = electron.dialog;
	app = electron.app;
}

let db: JsonDB;

reloadDB();

export function getConfigItem(key: string, defaultValue: unknown = null): any {
	try {
		db.reload();
	} catch (error) {
		logger.error('Error while reloading settings.json: ');
		logger.error(error);
	}

	const value = db.getData('/')[key];
	if (value === undefined) {
		setConfigItem(key, defaultValue);
		return defaultValue;
	}

	return value;
}

export function getConfigString(key: string, defaultValue: string): string {
	const value = getConfigItem(key, defaultValue);
	if (typeof value === 'string') {
		return value;
	}

	setConfigItem(key, defaultValue);
	return defaultValue;
}

// This function returns whether a key exists in the configuration file (settings.json)
export function isConfigItemExists(key: string): boolean {
	try {
		db.reload();
	} catch (error) {
		logger.error('Error while reloading settings.json: ');
		logger.error(error);
	}

	const value = db.getData('/')[key];
	return (value !== undefined);
}

export function setConfigItem(key: string, value: unknown, override? : boolean): void {
	if (EnterpriseUtil.configItemExists(key) && !override) {
		// If item is in global config and we're not trying to override
		return;
	}

	db.push(`/${key}`, value, true);
	db.save();
}

export function removeConfigItem(key: string): void {
	db.delete(`/${key}`);
	db.save();
}

function reloadDB(): void {
	const settingsJsonPath = path.join(app.getPath('userData'), '/config/settings.json');
	try {
		const file = fs.readFileSync(settingsJsonPath, 'utf8');
		JSON.parse(file);
	} catch (error) {
		if (fs.existsSync(settingsJsonPath)) {
			fs.unlinkSync(settingsJsonPath);
			dialog.showErrorBox(
				'Error saving settings',
				'We encountered an error while saving the settings.'
			);
			logger.error('Error while JSON parsing settings.json: ');
			logger.error(error);
			logger.reportSentry(error);
		}
	}

	db = new JsonDB(settingsJsonPath, true, true);
}
