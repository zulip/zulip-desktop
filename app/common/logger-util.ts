import {Console} from "console"; // eslint-disable-line node/prefer-global/console
import electron from "electron";
import fs from "fs";
import os from "os";

import {initSetUp} from "./default-util";
import {captureException, sentryInit} from "./sentry-util";

const {app} = process.type === "renderer" ? electron.remote : electron;

interface LoggerOptions {
  file?: string;
}

initSetUp();

let reportErrors = true;
if (process.type === "renderer") {
  // Report Errors to Sentry only if it is enabled in settings
  // Gets the value of reportErrors from config-util for renderer process
  // For main process, sentryInit() is handled in index.js
  const {ipcRenderer} = electron;
  ipcRenderer.send("error-reporting");
  ipcRenderer.on(
    "error-reporting-val",
    (_event: Event, errorReporting: boolean) => {
      reportErrors = errorReporting;
      if (reportErrors) {
        sentryInit();
      }
    },
  );
}

const logDir = app.getPath("logs");

type Level = "log" | "debug" | "info" | "warn" | "error";

export default class Logger {
  nodeConsole: Console;

  constructor(options: LoggerOptions = {}) {
    let {file = "console.log"} = options;

    file = `${logDir}/${file}`;

    // Trim log according to type of process
    if (process.type === "renderer") {
      requestIdleCallback(async () => this.trimLog(file));
    } else {
      process.nextTick(async () => this.trimLog(file));
    }

    const fileStream = fs.createWriteStream(file, {flags: "a"});
    const nodeConsole = new Console(fileStream);

    this.nodeConsole = nodeConsole;
  }

  _log(type: Level, ...args: unknown[]): void {
    args.unshift(this.getTimestamp() + " |\t");
    args.unshift(type.toUpperCase() + " |");
    this.nodeConsole[type](...args);
    console[type](...args);
  }

  log(...args: unknown[]): void {
    this._log("log", ...args);
  }

  debug(...args: unknown[]): void {
    this._log("debug", ...args);
  }

  info(...args: unknown[]): void {
    this._log("info", ...args);
  }

  warn(...args: unknown[]): void {
    this._log("warn", ...args);
  }

  error(...args: unknown[]): void {
    this._log("error", ...args);
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
    const data = await fs.promises.readFile(file, "utf8");

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
