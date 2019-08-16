import electron = require('electron');
let LevelDB: any = null;
if (process.type === 'browser') {
	LevelDB = require('../../../main/leveldb');
}

class LevelDBUtil {
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
}

export = new LevelDBUtil();
