import { app, dialog, BrowserWindow } from 'electron';

import path = require('path');
import fs = require('fs');
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

	async convertDB(databasePath: string): Promise<void> {
		let legacyDB = null;
		try {
			const file = fs.readFileSync(databasePath, 'utf8');
			// necessary to catch errors in JSON
			legacyDB = JSON.parse(file);
		} catch (err) {
			if (fs.existsSync(databasePath)) {
				fs.unlinkSync(databasePath);
				dialog.showErrorBox(
					'Error saving new organization',
					'There seems to be error while saving new organization, ' +
					'you may have to re-add your previous organizations back.'
				);
				logger.error('Error while JSON parsing domain.json: ');
				logger.error(err);
				logger.reportSentry(err);
			}
			return;
		}
		if (legacyDB) {
			if (databasePath.includes('domain')) {
				await this.domainsDB.put('domains', legacyDB.domains);
				this.domains = legacyDB.domains;
			} else {
				let batch = this.settingsDB.batch();
				for (const key in legacyDB) {
					if (legacyDB.hasOwnProperty(key)) {
						batch = batch.put(key, legacyDB[key]);
					}
				}
				await batch.write();
				this.settings = legacyDB;
			}
		}
		if (fs.existsSync(databasePath)) {
			// delete legacy database to complete migration.
			fs.unlinkSync(databasePath);
		}
	}

	loadSettings(): void {
		const databasePath = path.join(app.getPath('userData'), 'config/settings.json');
		if (fs.existsSync(databasePath)) {
			this.convertDB(databasePath);
			return;
		}
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
		const databasePath = path.join(app.getPath('userData'), 'config/domain.json');
		if (fs.existsSync(databasePath)) {
			this.convertDB(databasePath);
			return;
		}
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
