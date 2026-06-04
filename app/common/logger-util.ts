import { Console } from "node:console"; // eslint-disable-line n/prefer-global/console
import fs from "node:fs";
import os from "node:os";
import process from "node:process";

// FIXED: Standard Electron import path
import { app } from "electron"; 

import { initSetUp } from "./default-util"; // FIXED: Removed .ts extension

type LoggerOptions = {
  file?: string;
};

initSetUp();

// FIXED: Wrapped in backticks (`)
const logDirectory = `${app.getPath("userData")}/Logs`;

// Ensure the directory exists immediately to prevent ENOENT errors
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

type Level = "log" | "debug" | "info" | "warn" | "error";

export default class Logger {
  nodeConsole: Console;

  constructor(options: LoggerOptions = {}) {
    const { file = "console.log" } = options;

    // FIXED: Wrapped in backticks (`)
    const fullPath = `${logDirectory}/${file}`;

    // Trim log according to type of process
    if (process.type === "renderer") {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(async () => this.trimLog(fullPath));
      }
    } else {
      process.nextTick(async () => this.trimLog(fullPath));
    }

    const fileStream = fs.createWriteStream(fullPath, { flags: "a" });
    const nodeConsole = new Console(fileStream);

    this.nodeConsole = nodeConsole;
  }

  // FIXED: Renamed reserved keyword 'arguments' to 'args'
  private _internalLog(type: Level, ...args: unknown[]): void {
    args.unshift(this.getTimestamp() + " |\t");
    args.unshift(type.toUpperCase() + " |");
    // @ts-ignore - Dynamic access to console methods
    this.nodeConsole[type](...args);
    // @ts-ignore
    console[type](...args);
  }

  log(...args: unknown[]): void {
    this._internalLog("log", ...args);
  }

  debug(...args: unknown[]): void {
    this._internalLog("debug", ...args);
  }

  info(...args: unknown[]): void {
    this._internalLog("info", ...args);
  }

  warn(...args: unknown[]): void {
    this._internalLog("warn", ...args);
  }

  error(...args: unknown[]): void {
    this._internalLog("error", ...args);
  }

  getTimestamp(): string {
    const date = new Date();
    // FIXED: Wrapped the time section in backticks (`)
    const timestamp =
      `${date.getMonth() + 1}/${date.getDate()} ` +
      `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return timestamp;
  }

  async trimLog(file: string): Promise<void> {
    try {
      await fs.promises.access(file, fs.constants.F_OK);
      
      const data = await fs.promises.readFile(file, "utf8");
      const maxLogFileLines = 500;
      const logs = data.split(os.EOL);
      const logLength = logs.length - 1;

      if (logLength > maxLogFileLines) {
        const trimmedLogs = logs.slice(logLength - maxLogFileLines);
        const toWrite = trimmedLogs.join(os.EOL);
        await fs.promises.writeFile(file, toWrite);
      }
    } catch (error) {
      // FIXED: Wrapped in backticks (`)
      console.log(`New log file initialized: ${file}`);
    }
  }
}