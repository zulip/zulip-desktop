'use strict';
import JsonDB from 'node-json-db';

import fs = require('fs');
import path = require('path');
import electron = require('electron');
import Logger = require('./logger-util');

const logger = new Logger({
	file: 'config-util.log',
	timestamp: true
});

let instance: null | ConfigUtil = null;
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

class ConfigUtil {
	db: JsonDB;

	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		return instance;
	}

	getConfigItem(key: string, defaultValue: any = null): any {
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
	isConfigItemExists(key: string): boolean {
		try {
			this.db.reload();
		} catch (err) {
			logger.error('Error while reloading settings.json: ');
			logger.error(err);
		}
		const value = this.db.getData('/')[key];
		return (value !== undefined);
	}

	setConfigItem(key: string, value: any): void {
		this.db.push(`/${key}`, value, true);
		this.db.save();
	}

	removeConfigItem(key: string): void {
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
