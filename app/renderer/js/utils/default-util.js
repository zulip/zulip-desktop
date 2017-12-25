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
		setupCompleted = true;
	}
};

module.exports = {
	initSetUp
};
