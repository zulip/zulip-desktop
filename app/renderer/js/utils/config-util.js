'use strict';

const fs = require('fs');
const path = require('path');
const process = require('process');
const JsonDB = require('node-json-db');
const Logger = require('./logger-util');

const logger = new Logger({
	file: 'config-util.log',
	timestamp: true
});

let instance = null;
let dialog = null;
let app = null;

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
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		return instance;
	}

	getConfigItem(key, defaultValue = null) {
		this.reloadDB();
		const value = this.db.getData('/')[key];
		if (value === undefined) {
			this.setConfigItem(key, defaultValue);
			return defaultValue;
		} else {
			return value;
		}
	}
	// This function returns whether a key exists in the configuration file (settings.json)
	isConfigItemExists(key) {
		this.reloadDB();
		const value = this.db.getData('/')[key];
		return (value !== undefined);
	}

	setConfigItem(key, value) {
		this.db.push(`/${key}`, value, true);
		this.reloadDB();
	}

	removeConfigItem(key) {
		this.db.delete(`/${key}`);
		this.reloadDB();
	}

	reloadDB() {
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

module.exports = new ConfigUtil();
