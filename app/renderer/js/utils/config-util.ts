'use strict';
import { ipcRenderer } from 'electron';

import EnterpriseUtil = require('./enterprise-util');
import DataStore = require('../../../main/datastore');
import LevelDB = require('../../../main/leveldb');

class ConfigUtil {
	settings: any;

	constructor() {
		this.settings = {};
		DataStore.loadSettings();
	}

	getConfigItem(key: string, defaultValue: any = null): any {
		const value = this.settings[key];
		if (value === undefined) {
			this.setConfigItem(key, defaultValue);
			return defaultValue;
		} else {
			return value;
		}
	}

	// This function returns whether a key exists in the configuration file (settings.json)
	isConfigItemExists(key: string): boolean {
		const value = this.settings[key];
		return (value !== undefined);
	}

	setConfigItem(key: string, value: any, override? : boolean): void {
		if (EnterpriseUtil.configItemExists(key) && !override) {
			// if item is in global config and we're not trying to override
			return;
		}
		this.settings[key] = value;
		if (process.type === 'renderer') {
			ipcRenderer.send('leveldb-set-item', key, value);
			return;
		}
		LevelDB.settings.setItem(key, value);
	}

	removeConfigItem(key: string): void {
		this.settings.delete(key);
		if (process.type === 'renderer') {
			ipcRenderer.send('leveldb-delete-item', key);
			return;
		}
		LevelDB.settings.deleteItem(key);
	}

	updateSettings(settings: any): void {
		this.settings = settings;
	}
}

export = new ConfigUtil();
