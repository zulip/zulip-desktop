const fs = require('fs');
const { app } = require('electron').remote;

const logDir = `${app.getPath('userData')}/Logs/`;

const initSetUp = () => {
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir);
	}
};

module.exports = {
	initSetUp
};
