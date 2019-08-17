import { app } from 'electron';
import level from 'level';

import path = require('path');
import Logger = require('../renderer/js/utils/logger-util');

const logger = new Logger({
	file: 'leveldb.log',
	timestamp: true
});

const settingsJsonPath = path.join(app.getPath('userData'), 'config/settings');
const domainsJsonPath = path.join(app.getPath('userData'), 'config/domains');

class LevelDB {
	// TODO: change this to a proper type
	db: any;
	constructor(databasePath: string) {
		this.reloadDB(databasePath);
	}

	reloadDB(databasePath: string): void {
		try {
			this.db = level(databasePath, { valueEncoding: 'json' });
		} catch (err) {
			logger.error(err);
			logger.reportSentry(err.toString());
		}
	}

	async setItem(key: string, value: any): Promise<void> {
		try {
			if (value === null || value === undefined) {
				// sentinel value needed because leveldb doesn't allow
				// null or undefined values in database.
				value = '__null__';
			}
			return await this.db.put(key, value);
		} catch (err) {
			logger.error(err);
			logger.reportSentry(err.toString());
		}
	}

	async doesItemExist(key: string): Promise<boolean> {
		try {
			await this.db.get(key);
			// if control reaches here, key is present and accessible
			return true;
		} catch (err) {
			return false;
		}
	}

	async deleteItem(key: string): Promise<boolean> {
		try {
			return await this.db.del(key);
		} catch (err) {
			if (err instanceof level.errors.NotFoundError) {
				// key does not exist in database
				// no need to report this to Sentry
				return false;
			}
			logger.error(err);
			logger.reportSentry(err.toString());
			return false;
		}
	}
}

export = {
	settings: new LevelDB(settingsJsonPath),
	domains: new LevelDB(domainsJsonPath)
};
