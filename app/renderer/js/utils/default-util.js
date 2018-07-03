const fs = require('fs');

let app = null;
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
const initSetUp = () => {
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

		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir);
			const domainJson = `${zulipDir}/domain.json`;
			const certificatesJson = `${zulipDir}/certificates.json`;
			const settingsJson = `${zulipDir}/settings.json`;
			const updatesJson = `${zulipDir}/updates.json`;
			const windowStateJson = `${zulipDir}/window-state.json`;
			if (fs.existsSync(domainJson)) {
				fs.copyFileSync(domainJson, configDir + `domain.json`);
				fs.unlinkSync(domainJson);
			}
			if (fs.existsSync(certificatesJson)) {
				fs.copyFileSync(certificatesJson, configDir + `certificates.json`);
				fs.unlinkSync(certificatesJson);
			}
			if (fs.existsSync(settingsJson)) {
				fs.copyFileSync(settingsJson, configDir + `settings.json`);
				fs.unlinkSync(settingsJson);
			}
			if (fs.existsSync(updatesJson)) {
				fs.copyFileSync(updatesJson, configDir + `updates.json`);
				fs.unlinkSync(updatesJson);
			}
			if (fs.existsSync(windowStateJson)) {
				fs.unlinkSync(windowStateJson);
			}
		}

		setupCompleted = true;
	}
};

module.exports = {
	initSetUp
};
