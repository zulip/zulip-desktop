import { BrowserWindow } from 'electron';

import LevelDB = require('./leveldb');
import Logger = require('../renderer/js/utils/logger-util');

const logger = new Logger({
	file: 'datastore.log',
	timestamp: true
});

class DataStore {
	settingsDB: any;
	settings: any;
	domainsDB: any;
	domains: Domain[];
	constructor() {
		this.settings = {};
		this.domains = [];

		this.settingsDB = LevelDB.settings.db;
		this.domainsDB = LevelDB.domains.db;

		this.loadSettings();
		this.loadDomains();
	}

	loadSettings(): void {
		this.settingsDB.createReadStream().on('data', (configItem: any) => {
			if (configItem.value === '__null__') {
				configItem.value = null;
			}
			this.settings[configItem.key] = configItem.value;
			this.updateUtil('config-update');
		}).on('error', (err: Error) => {
			logger.error(err);
		});
	}

	loadDomains(): void {
		this.domainsDB.createReadStream().on('data', (domains: any) => {
			this.domains = domains.value;
			this.updateUtil('domain-update');
		}).on('error', (err: Error) => {
			logger.error(err);
		});
	}

	updateUtil(message: string): void {
		const win = BrowserWindow.getAllWindows()[0];
		if (process.platform === 'darwin') {
			win.restore();
		}
		if (process.type === 'browser') {
			win.webContents.send(message, this.settings);
		} else {
			win.webContents.send('forward-message', message, this.settings);
		}
	}
}

export = new DataStore();
