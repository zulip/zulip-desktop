'use strict';

const fs = require('fs');
const path = require('path');
const process = require('process');
const remote =
	process.type === 'renderer' ? require('electron').remote : require('electron');
const JsonDB = require('node-json-db');
const Logger = require('./logger-util');

const logger = new Logger({
	file: 'linux-update-util.log',
	timestamp: true
});

/* To make the util runnable in both main and renderer process */
const { dialog, app } = remote;

let instance = null;

class LinuxUpdateUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		return instance;
	}

	getUpdateItem(key, defaultValue = null) {
		this.reloadDB();
		const value = this.db.getData('/')[key];
		if (value === undefined) {
			this.setUpdateItem(key, defaultValue);
			return defaultValue;
		} else {
			return value;
		}
	}

	setUpdateItem(key, value) {
		this.db.push(`/${key}`, value, true);
		this.reloadDB();
	}

	removeUpdateItem(key) {
		this.db.delete(`/${key}`);
		this.reloadDB();
	}

	reloadDB() {
		const linuxUpdateJsonPath = path.join(app.getPath('userData'), '/config/updates.json');
		try {
			const file = fs.readFileSync(linuxUpdateJsonPath, 'utf8');
			JSON.parse(file);
		} catch (err) {
			if (fs.existsSync(linuxUpdateJsonPath)) {
				fs.unlinkSync(linuxUpdateJsonPath);
				dialog.showErrorBox(
					'Error saving update notifications.',
					'We encountered an error while saving the update notifications.'
				);
				logger.error('Error while JSON parsing updates.json: ');
				logger.error(err);
			}
		}
		this.db = new JsonDB(linuxUpdateJsonPath, true, true);
	}
}

module.exports = new LinuxUpdateUtil();
