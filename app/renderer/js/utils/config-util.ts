'use strict';
import LevelDBUtil = require('./leveldb-util');
import EnterpriseUtil = require('./enterprise-util');

class ConfigUtil {
	settings: any;

	constructor() {
		this.settings = {};
		this.reloadDB();
	}

	reloadDB(): void {
		if (process.type === 'renderer') {
			LevelDBUtil.initConfigUtil().then(settings => {
				this.settings = settings;
			});
		}
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
		LevelDBUtil.setConfigItem(key, value);
	}

	removeConfigItem(key: string): void {
		this.settings.delete(key);
		LevelDBUtil.removeConfigItem(key);
	}

	updateSettings(settings: any): void {
		this.settings = settings;
	}
}

export = new ConfigUtil();
