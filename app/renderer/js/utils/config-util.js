'use strict';

const process = require('process');
const JsonDB = require('node-json-db');

let instance = null;
let app = null;

/* To make the util runnable in both main and renderer process */
if (process.type === 'renderer') {
	app = require('electron').remote.app;
} else {
	app = require('electron').app;
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
		const value = this.db.getData('/')[key];
		if (value === undefined) {
			this.setConfigItem(key, defaultValue);
			return defaultValue;
		} else {
			return value;
		}
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
		this.db = new JsonDB(app.getPath('userData') + '/settings.json', true, true);
	}
}

module.exports = new ConfigUtil();
