import assert from "node:assert";
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";

import {type ElectronApplication, _electron} from "playwright-core";

let temporaryPath: string | undefined;
let openedUrlsSocket: net.Socket | undefined;
let openedUrls: AsyncIterator<string> | undefined;

// Runs Zulip Desktop.
// Returns a promise that resolves to an Electron Application once the app has loaded.
export async function createApp(): Promise<ElectronApplication> {
  if (temporaryPath !== undefined) {
    throw new Error("App was already created");
  }

  temporaryPath = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "zulip-test-"),
  );

  const env: Record<string, string> = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[name] = value;
    }
  }

  if (process.platform === "linux") {
    // Electron opens external URLs by running xdg-open from PATH.  Put a
    // fake default browser there that sends each URL it is asked to open
    // through a named pipe.
    const binPath = path.join(temporaryPath, "bin");
    await fs.promises.mkdir(binPath);
    await fs.promises.writeFile(
      path.join(binPath, "xdg-open"),
      '#!/bin/sh\nprintf \'%s\\n\' "$*" > "$ZULIP_TEST_OPENED_URLS"\n',
      {mode: 0o755},
    );
    const openedUrlsPath = path.join(temporaryPath, "opened-urls");
    execFileSync("mkfifo", [openedUrlsPath]);
    // Opening the pipe read-write keeps a writer attached, so we never see
    // EOF and xdg-open never blocks.
    openedUrlsSocket = new net.Socket({
      fd: fs.openSync(openedUrlsPath, "r+"),
      readable: true,
    });
    const lines = readline.createInterface({input: openedUrlsSocket});
    openedUrls = lines[Symbol.asyncIterator]();
    env.PATH = [binPath, env.PATH].join(path.delimiter);
    env.ZULIP_TEST_OPENED_URLS = openedUrlsPath;
  }

  return _electron.launch({
    args: [
      `--user-data-dir=${path.join(temporaryPath, "user-data")}`,
      path.join(import.meta.dirname, ".."),
    ],
    env,
  });
}

// Waits for the app to open a URL in the fake default browser (Linux only).
export async function nextOpenedUrl(): Promise<string> {
  assert.ok(openedUrls !== undefined);
  const result = await openedUrls.next();
  assert.ok(!result.done);
  return result.value;
}

// Quit the app, end the test
export async function endTest(app: ElectronApplication): Promise<void> {
  await app.close();
  openedUrlsSocket?.destroy();
  openedUrlsSocket = undefined;
  openedUrls = undefined;
  if (temporaryPath !== undefined) {
    await fs.promises.rm(temporaryPath, {recursive: true});
    temporaryPath = undefined;
  }
}
