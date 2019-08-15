import LevelDB = require('./leveldb');
import Logger = require('../renderer/js/utils/logger-util');

const logger = new Logger({
	file: 'datastore.log',
	timestamp: true
});

class DataStore {
	settingsDB: any;
	settings: any;
	constructor() {
		this.settings = {};
		this.settingsDB = LevelDB.settings.db;
	}

	loadSettings(): void {
		this.settingsDB.createReadStream().on('data', (configItem: any) => {
			if (configItem.value === '__null__') {
				configItem.value = null;
			}
			this.settings[configItem.key] = configItem.value;
		}).on('error', (err: Error) => {
			logger.error(err);
		});
	}
}

export = new DataStore();
