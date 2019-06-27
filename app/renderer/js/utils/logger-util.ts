import { Console as NodeConsole } from 'console'; // eslint-disable-line node/prefer-global/console
import { initSetUp } from './default-util';
import { sentryInit, captureException } from './sentry-util';

import fs = require('fs');
import os = require('os');
import isDev = require('electron-is-dev');
import electron = require('electron');
// this interface adds [key: string]: any so
// we can do console[type] later on in the code
interface PatchedConsole extends Console {
	[key: string]: any;
}

interface LoggerOptions {
	timestamp?: any;
	file?: string;
	level?: boolean;
	logInDevMode?: boolean;
}

initSetUp();

let app: Electron.App = null;
let reportErrors = true;
if (process.type === 'renderer') {
	app = electron.remote.app;

	// Report Errors to Sentry only if it is enabled in settings
	// Gets the value of reportErrors from config-util for renderer process
	// For main process, sentryInit() is handled in index.js
	const { ipcRenderer } = electron;
	ipcRenderer.send('error-reporting');
	ipcRenderer.on('error-reporting-val', (_event: any, errorReporting: boolean) => {
		reportErrors = errorReporting;
		if (reportErrors) {
			sentryInit();
		}
	});
} else {
	app = electron.app;
}

const browserConsole: PatchedConsole = console;
const logDir = `${app.getPath('userData')}/Logs`;

class Logger {
	nodeConsole: PatchedConsole;
	timestamp: any; // TODO: TypeScript - Figure out how to make this work with string | Function.
	level: boolean;
	logInDevMode: boolean;
	[key: string]: any;

	constructor(opts: LoggerOptions = {}) {
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

	_log(type: string, ...args: any[]): void {
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
				nodeConsoleLog.apply(null, args); // eslint-disable-line prefer-spread

			default: break;
		}
		/* eslint-enable no-fallthrough */

		browserConsole[type].apply(null, args);
	}

	setUpConsole(): void {
		for (const type in browserConsole) {
			this.setupConsoleMethod(type);
		}
	}

	setupConsoleMethod(type: string): void {
		this[type] = (...args: any[]) => {
			const log = this._log.bind(this, type, ...args);
			log();
		};
	}

	getTimestamp(): string {
		const date = new Date();
		const timestamp =
			`${date.getMonth()}/${date.getDate()} ` +
			`${date.getMinutes()}:${date.getSeconds()}`;
		return timestamp;
	}

	reportSentry(err: string): void {
		if (reportErrors) {
			captureException(err);
		}
	}

	trimLog(file: string): void{
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

export = Logger;
