import {Console} from 'console'; // eslint-disable-line node/prefer-global/console
import electron from 'electron';
import fs from 'fs';
import os from 'os';

import isDev from 'electron-is-dev';

import {initSetUp} from './default-util';
import {sentryInit, captureException} from './sentry-util';

interface LoggerOptions {
	timestamp?: true | (() => string);
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
	const {ipcRenderer} = electron;
	ipcRenderer.send('error-reporting');
	ipcRenderer.on('error-reporting-val', (_event: Event, errorReporting: boolean) => {
		reportErrors = errorReporting;
		if (reportErrors) {
			sentryInit();
		}
	});
} else {
	app = electron.app;
}

const logDir = `${app.getPath('userData')}/Logs`;

type Level = 'log' | 'debug' | 'info' | 'warn' | 'error';
const levels: Level[] = ['log', 'debug', 'info', 'warn', 'error'];
type LogMethod = (...args: unknown[]) => void;

export default class Logger {
	log: LogMethod;
	debug: LogMethod;
	info: LogMethod;
	warn: LogMethod;
	error: LogMethod;

	nodeConsole: Console;
	timestamp?: () => string;
	level: boolean;
	logInDevMode: boolean;

	constructor(options: LoggerOptions = {}) {
		let {
			timestamp = true,
			file = 'console.log',
			level = true,
			logInDevMode = false
		} = options;

		file = `${logDir}/${file}`;
		if (timestamp === true) {
			timestamp = this.getTimestamp;
		}

		// Trim log according to type of process
		if (process.type === 'renderer') {
			requestIdleCallback(async () => this.trimLog(file));
		} else {
			process.nextTick(async () => this.trimLog(file));
		}

		const fileStream = fs.createWriteStream(file, {flags: 'a'});
		const nodeConsole = new Console(fileStream);

		this.nodeConsole = nodeConsole;
		this.timestamp = timestamp;
		this.level = level;
		this.logInDevMode = logInDevMode;
		this.setUpConsole();
	}

	_log(type: Level, ...args: unknown[]): void {
		const {
			nodeConsole, timestamp, level, logInDevMode
		} = this;

		switch (true) {
			case typeof timestamp === 'function':
				args.unshift(timestamp() + ' |\t');
				// Fall through

			case (level):
				args.unshift(type.toUpperCase() + ' |');
				// Fall through

			case isDev || logInDevMode:
				nodeConsole[type](...args);
				break;

			default:
		}

		console[type](...args);
	}

	setUpConsole(): void {
		for (const type of levels) {
			this.setupConsoleMethod(type);
		}
	}

	setupConsoleMethod(type: Level): void {
		this[type] = (...args: unknown[]) => {
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

	reportSentry(error: unknown): void {
		if (reportErrors) {
			captureException(error);
		}
	}

	async trimLog(file: string): Promise<void> {
		const data = await fs.promises.readFile(file, 'utf8');

		const MAX_LOG_FILE_LINES = 500;
		const logs = data.split(os.EOL);
		const logLength = logs.length - 1;

		// Keep bottom MAX_LOG_FILE_LINES of each log instance
		if (logLength > MAX_LOG_FILE_LINES) {
			const trimmedLogs = logs.slice(logLength - MAX_LOG_FILE_LINES);
			const toWrite = trimmedLogs.join(os.EOL);
			await fs.promises.writeFile(file, toWrite);
		}
	}
}
