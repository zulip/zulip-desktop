const NodeConsole = require('console').Console;
const fs = require('fs');
const isDev = require('electron-is-dev');
const { initSetUp } = require('./default-util');

initSetUp();
let app = null;
if (process.type === 'renderer') {
	app = require('electron').remote.app;
} else {
	app = require('electron').app;
}

const browserConsole = console;
const logDir = `${app.getPath('userData')}/Logs`;

class Logger {
	constructor(opts = {}) {
		let {
			timestamp = true,
			file = 'console.log',
			level = true,
			logInDevMode = false
		} = opts;

		file = `${logDir}/${file}`;
		if (timestamp === true) {
			timestamp = this.getTimestamp;
		}

		const fileStream = fs.createWriteStream(file, { flags: 'a' });
		const nodeConsole = new NodeConsole(fileStream);

		this.nodeConsole = nodeConsole;
		this.timestamp = timestamp;
		this.level = level;
		this.logInDevMode = logInDevMode;
		this.setUpConsole();
	}

	_log(type, ...args) {
		const {
			nodeConsole, timestamp, level, logInDevMode
		} = this;
		let nodeConsoleLog;

		/* eslint-disable no-fallthrough */
		switch (true) {
			case typeof timestamp === 'function':
				args.unshift(timestamp() + ' |\t');

			case (level !== false):
				args.unshift(type.toUpperCase() + ' |');

			case isDev || logInDevMode:
				nodeConsoleLog = nodeConsole[type] || nodeConsole.log;
				nodeConsoleLog.apply(null, args);

			default: break;
		}
		/* eslint-enable no-fallthrough */

		browserConsole[type].apply(null, args);
	}

	setUpConsole() {
		for (const type in browserConsole) {
			this.setupConsoleMethod(type);
		}
	}

	setupConsoleMethod(type) {
		this[type] = (...args) => {
			this._log(type, ...args);
		};
	}

	getTimestamp() {
		const date = new Date();
		const timestamp =
			`${date.getMonth()}/${date.getDate()} ` +
			`${date.getMinutes()}:${date.getSeconds()}`;
		return timestamp;
	}
}

module.exports = Logger;
