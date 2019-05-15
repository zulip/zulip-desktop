const NodeConsole = require('console').Console;
const fs = require('fs');
const os = require('os');
const isDev = require('electron-is-dev');
const { initSetUp } = require('./default-util');
const { sentryInit, captureException } = require('./sentry-util');

initSetUp();

let app = null;
let reportErrors = true;
if (process.type === 'renderer') {
	app = require('electron').remote.app;

	// Report Errors to Sentry only if it is enabled in settings
	// Gets the value of reportErrors from config-util for renderer process
	// For main process, sentryInit() is handled in index.js
	const { ipcRenderer } = require('electron');
	ipcRenderer.send('error-reporting');
	ipcRenderer.on('error-reporting-val', (event, errorReporting) => {
		reportErrors = errorReporting;
		if (reportErrors) {
			sentryInit();
		}
	});
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

		// Trim log according to type of process
		if (process.type === 'renderer') {
			requestIdleCallback(() => this.trimLog(file));
		} else {
			process.nextTick(() => this.trimLog(file));
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

	reportSentry(err) {
		if (reportErrors) {
			captureException(err);
		}
	}

	trimLog(file) {
		fs.readFile(file, 'utf8', (err, data) => {
			if (err) {
				throw err;
			}
			const MAX_LOG_FILE_LINES = 500;
			const logs = data.split(os.EOL);
			const logLength = logs.length - 1;

			// Keep bottom MAX_LOG_FILE_LINES of each log instance
			if (logLength > MAX_LOG_FILE_LINES) {
				const trimmedLogs = logs.slice(logLength - MAX_LOG_FILE_LINES);
				const toWrite = trimmedLogs.join(os.EOL);
				fs.writeFileSync(file, toWrite);
			}
		});
	}
}

module.exports = Logger;
