'use strict';

const {app} = require('electron').remote;
const JsonDB = require('node-json-db');

let instance = null;

class ConfigUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.db = new JsonDB(app.getPath('userData') + '/config.json', true, true);
		return instance;
	}

	getConfigItem(key, defaultValue = null) {
		const value = this.db.getData('/')[key];
		if (value === undefined) {
			this.setConfigItem(key, value);
			return defaultValue;
		} else {
			return value;
		}
	}

	setConfigItem(key, value) {
		this.db.push(`/${key}`, value, true);
	}

	removeConfigItem(key) {
		this.db.delete(`/${key}`);
	}
}

module.exports = new ConfigUtil();
