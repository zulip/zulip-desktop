import fs = require('fs');
import path = require('path');

import Logger = require('./logger-util');

const logger = new Logger({
	file: 'enterprise-util.log',
	timestamp: true
});

let instance: null | EnterpriseUtil = null;

class EnterpriseUtil {
	// todo: replace enterpriseSettings type with an interface once settings are final
	enterpriseSettings: any;
	constructor() {
		if (instance) {
			return instance;
		}
		instance = this;

		this.reloadDB();
	}

	reloadDB(): void {
		let enterpriseFile = '/etc/zulip-desktop-config/global_config.json';
		if (process.platform === 'win32') {
			enterpriseFile = 'C:\\Program Files\\Zulip-Desktop-Config\\global_config.json';
		}

		enterpriseFile = path.resolve(enterpriseFile);
		if (fs.existsSync(enterpriseFile)) {
			try {
				const file = fs.readFileSync(enterpriseFile, 'utf8');
				this.enterpriseSettings = JSON.parse(file);
			} catch (err) {
				logger.log('Error while JSON parsing global_config.json: ');
				logger.log(err);
			}
		}
	}

	getConfigItem(key: string, defaultValue?: any): any {
		this.reloadDB();
		if (defaultValue === undefined) {
			defaultValue = null;
		}
		return this.configItemExists(key) ? this.enterpriseSettings[key] : defaultValue;
	}

	configItemExists(key: string): boolean {
		this.reloadDB();
		return (this.enterpriseSettings[key] !== undefined);
	}

	isPresetOrg(url: string): boolean {
		if (!this.configItemExists('presetOrganizations')) {
			return false;
		}
		const presetOrgs = this.enterpriseSettings.presetOrganizations;
		for (const org of presetOrgs) {
			if (url.includes(org)) {
				return true;
			}
		}
		return false;
	}
}

export = new EnterpriseUtil();
