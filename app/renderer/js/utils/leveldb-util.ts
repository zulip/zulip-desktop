import electron = require('electron');
import Logger = require('./logger-util');
let LevelDB: any = null;
let ipcRenderer: Electron.IpcRenderer = null;
if (process.type === 'browser') {
	LevelDB = require('../../../main/leveldb');
} else {
	ipcRenderer = electron.ipcRenderer;
}

const logger = new Logger({
	file: 'leveldb-util.log',
	timestamp: true
});

class LevelDBUtil {
	initConfigUtil(): Promise<any> {
		return new Promise(resolve => {
			const settings = ipcRenderer.sendSync('get-settings');
			resolve(settings);
		});
	}

	initDomainUtil(): Promise<Domain[]> {
		return new Promise(resolve => {
			const domains = ipcRenderer.sendSync('get-domains');
			resolve(domains);
		});
	}

	setConfigItem(key: string, value: any): void {
		if (process.type === 'renderer') {
			const { ipcRenderer } = electron;
			ipcRenderer.send('db-set-item', key, value);
			return;
		}
		LevelDB.settings.setItem(key, value);
	}

	removeConfigItem(key: string): void {
		if (process.type === 'renderer') {
			const { ipcRenderer } = electron;
			ipcRenderer.send('db-delete-item', key);
			return;
		}
		LevelDB.settings.deleteItem(key);
	}

	async updateDomains(domains: Domain[]): Promise<void> {
		logger.log(JSON.stringify(domains));
		if (process.type === 'renderer') {
			const { ipcRenderer } = electron;
			ipcRenderer.sendSync('db-update-domains', domains);
			return;
		}
		await LevelDB.domains.deleteItem('domains');
		await LevelDB.domains.setItem('domains', domains);
	}
}

export = new LevelDBUtil();
