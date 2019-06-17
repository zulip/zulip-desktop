'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import JsonDB from 'node-json-db';
import { Logger } from './logger-util';

const logger = new Logger({
	file: 'config-util.log',
	timestamp: true
});

let instance: any = null;
let dialog: any = null;
let app: any = null;

/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
	const remote = require('electron').remote;
	dialog = remote.dialog;
	app = remote.app;
} else {
	const electron = require('electron');
	dialog = electron.dialog;
	app = electron.app;
}

class ConfigUtil {
	db: any;

	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		return instance;
	}

	getConfigItem(key: any, defaultValue: any = null): any {
		try {
			this.db.reload();
		} catch (err) {
			logger.error('Error while reloading settings.json: ');
			logger.error(err);
		}
		const value = this.db.getData('/')[key];
		if (value === undefined) {
			this.setConfigItem(key, defaultValue);
			return defaultValue;
		} else {
			return value;
		}
	}
	
	// This function returns whether a key exists in the configuration file (settings.json)
	isConfigItemExists(key: any): boolean {
		try {
			this.db.reload();
		} catch (err) {
			logger.error('Error while reloading settings.json: ');
			logger.error(err);
		}
		const value = this.db.getData('/')[key];
		return (value !== undefined);
	}

	setConfigItem(key: any, value: any): void {
		this.db.push(`/${key}`, value, true);
		this.db.save();
	}

	removeConfigItem(key: any): void {
		this.db.delete(`/${key}`);
		this.db.save();
	}

	reloadDB(): void {
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
		this.db = new JsonDB(settingsJsonPath, true, true);
	}
}

export = new ConfigUtil();
