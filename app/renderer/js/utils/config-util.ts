import { JsonDB } from 'node-json-db';

import fs from 'fs';
import path from 'path';
import electron from 'electron';
import Logger from './logger-util';
import * as EnterpriseUtil from './enterprise-util';

const logger = new Logger({
	file: 'config-util.log',
	timestamp: true
});

let dialog: Electron.Dialog = null;
let app: Electron.App = null;

/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
	const { remote } = electron;
	dialog = remote.dialog;
	app = remote.app;
} else {
	dialog = electron.dialog;
	app = electron.app;
}

let db: JsonDB;

reloadDB();

export function getConfigItem(key: string, defaultValue: any = null): any {
	try {
		db.reload();
	} catch (err) {
		logger.error('Error while reloading settings.json: ');
		logger.error(err);
	}
	const value = db.getData('/')[key];
	if (value === undefined) {
		setConfigItem(key, defaultValue);
		return defaultValue;
	} else {
		return value;
	}
}

// This function returns whether a key exists in the configuration file (settings.json)
export function isConfigItemExists(key: string): boolean {
	try {
		db.reload();
	} catch (err) {
		logger.error('Error while reloading settings.json: ');
		logger.error(err);
	}
	const value = db.getData('/')[key];
	return (value !== undefined);
}

export function setConfigItem(key: string, value: any, override? : boolean): void {
	if (EnterpriseUtil.configItemExists(key) && !override) {
		// if item is in global config and we're not trying to override
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
	} catch (err) {
		if (fs.existsSync(settingsJsonPath)) {
			fs.unlinkSync(settingsJsonPath);
			dialog.showErrorBox(
				'Error saving settings',
				'We encountered an error while saving the settings.'
			);
			logger.error('Error while JSON parsing settings.json: ');
			logger.error(err);
			logger.reportSentry(err);
		}
	}
	db = new JsonDB(settingsJsonPath, true, true);
}
