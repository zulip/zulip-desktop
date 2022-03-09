import {Console} from "console"; // eslint-disable-line node/prefer-global/console
import fs from "fs";
import os from "os";

import {initSetUp} from "./default-util.js";
import {app} from "./remote.js";

interface LoggerOptions {
  file?: string;
}

initSetUp();

const logDir = `${app.getPath("userData")}/Logs`;

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
