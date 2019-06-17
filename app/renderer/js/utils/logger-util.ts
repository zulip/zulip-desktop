import { Console as NodeConsole } from 'console';
import * as fs from 'fs';
import * as os from 'os';
import * as isDev from 'electron-is-dev';
import { root } from 'getroot';
import { initSetUp } from './default-util';
import { sentryInit, captureException } from './sentry-util';

export interface LoggerOptions {
	timestamp?: any;
	file?: string;
	level?: boolean;
	logInDevMode?: boolean;
}

export interface Logger {
	nodeConsole: any;
	timestamp: any;
	level: boolean;
	logInDevMode: boolean;
	[key: string]: any;
}

export interface Console {
	[key: string]: any;
}

initSetUp();

let app: any = null;
let reportErrors: boolean = true;
if (process.type === 'renderer') {
	app = require('electron').remote.app;

	// Report Errors to Sentry only if it is enabled in settings
	// Gets the value of reportErrors from config-util for renderer process
	// For main process, sentryInit() is handled in index.js
	const { ipcRenderer } = require('electron');
	ipcRenderer.send('error-reporting');
	ipcRenderer.on('error-reporting-val', (_event: any, errorReporting: boolean) => {
		reportErrors = errorReporting;
		if (reportErrors) {
			sentryInit();
		}
	});
} else {
	app = require('electron').app;
}

const browserConsole: Console = console;
const logDir = `${app.getPath('userData')}/Logs`;

export class Logger {
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
			root.requestIdleCallback(() => this.trimLog(file));
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
				nodeConsoleLog.apply(null, args);

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
			this._log(type, ...args);
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
