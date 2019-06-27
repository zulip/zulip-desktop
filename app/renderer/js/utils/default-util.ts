import fs = require('fs');

let app: Electron.App;
let setupCompleted = false;
if (process.type === 'renderer') {
	app = require('electron').remote.app;
} else {
	app = require('electron').app;
}

const zulipDir = app.getPath('userData');
const logDir = `${zulipDir}/Logs/`;
const certificatesDir = `${zulipDir}/certificates/`;
const configDir = `${zulipDir}/config/`;
export const initSetUp = (): void => {
	// if it is the first time the app is running
	// create zulip dir in userData folder to
	// avoid errors
	if (!setupCompleted) {
		if (!fs.existsSync(zulipDir)) {
			fs.mkdirSync(zulipDir);
		}

		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir);
		}

		if (!fs.existsSync(certificatesDir)) {
			fs.mkdirSync(certificatesDir);
		}

		// Migrate config files from app data folder to config folder inside app
		// data folder. This will be done once when a user updates to the new version.
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir);
			const domainJson = `${zulipDir}/domain.json`;
			const certificatesJson = `${zulipDir}/certificates.json`;
			const settingsJson = `${zulipDir}/settings.json`;
			const updatesJson = `${zulipDir}/updates.json`;
			const windowStateJson = `${zulipDir}/window-state.json`;
			const configData = [
				{
					path: domainJson,
					fileName: `domain.json`
				},
				{
					path: certificatesJson,
					fileName: `certificates.json`
				},
				{
					path: settingsJson,
					fileName: `settings.json`
				},
				{
					path: updatesJson,
					fileName: `updates.json`
				}
			];
			configData.forEach(data => {
				if (fs.existsSync(data.path)) {
					fs.copyFileSync(data.path, configDir + data.fileName);
					fs.unlinkSync(data.path);
				}
			});
			// window-state.json is only deleted not moved, as the electron-window-state
			// package will recreate the file in the config folder.
			if (fs.existsSync(windowStateJson)) {
				fs.unlinkSync(windowStateJson);
			}
		}

		setupCompleted = true;
	}
};
