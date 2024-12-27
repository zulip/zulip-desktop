import {Console} from "node:console"; // eslint-disable-line n/prefer-global/console
import fs from "node:fs";
import os from "node:os";
import process from "node:process";

import {app} from "zulip:remote";

import {initSetUp} from "./default-util.js";

type LoggerOptions = {
  file?: string;
};

initSetUp();

const logDirectory = `${app.getPath("userData")}/Logs`;

type Level = "log" | "debug" | "info" | "warn" | "error";

export default class Logger {
  nodeConsole: Console;

  constructor(options: LoggerOptions = {}) {
    let {file = "console.log"} = options;

    file = `${logDirectory}/${file}`;

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

  _log(type: Level, ...arguments_: unknown[]): void {
    arguments_.unshift(this.getTimestamp() + " |\t");
    arguments_.unshift(type.toUpperCase() + " |");
    this.nodeConsole[type](...arguments_);
    console[type](...arguments_);
  }

  log(...arguments_: unknown[]): void {
    this._log("log", ...arguments_);
  }

  debug(...arguments_: unknown[]): void {
    this._log("debug", ...arguments_);
  }

  info(...arguments_: unknown[]): void {
    this._log("info", ...arguments_);
  }

  warn(...arguments_: unknown[]): void {
    this._log("warn", ...arguments_);
  }

  error(...arguments_: unknown[]): void {
    this._log("error", ...arguments_);
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

    const maxLogFileLines = 500;
    const logs = data.split(os.EOL);
    const logLength = logs.length - 1;

    // Keep bottom maxLogFileLines of each log instance
    if (logLength > maxLogFileLines) {
      const trimmedLogs = logs.slice(logLength - maxLogFileLines);
      const toWrite = trimmedLogs.join(os.EOL);
      await fs.promises.writeFile(file, toWrite);
    }
  }
}
