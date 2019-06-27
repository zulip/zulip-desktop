'use strict';
import JsonDB from 'node-json-db';

import fs = require('fs');
import path = require('path');
import electron = require('electron');
import Logger = require('./logger-util');

const remote =
	process.type === 'renderer' ? electron.remote : electron;

const logger = new Logger({
	file: 'linux-update-util.log',
	timestamp: true
});

/* To make the util runnable in both main and renderer process */
const { dialog, app } = remote;
let instance: null | LinuxUpdateUtil = null;

class LinuxUpdateUtil {
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

	getUpdateItem(key: string, defaultValue: any = null): any {
		this.reloadDB();
		const value = this.db.getData('/')[key];
		if (value === undefined) {
			this.setUpdateItem(key, defaultValue);
			return defaultValue;
		} else {
			return value;
		}
	}

	setUpdateItem(key: string, value: any): void {
		this.db.push(`/${key}`, value, true);
		this.reloadDB();
	}

	removeUpdateItem(key: string): void {
		this.db.delete(`/${key}`);
		this.reloadDB();
	}

	reloadDB(): void {
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

export = new LinuxUpdateUtil();
