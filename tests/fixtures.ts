import assert from "node:assert";
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";

import {
  type ElectronApplication,
  type Page,
  test as base,
} from "@playwright/test";

type ElectronSession = {
  electronApp: ElectronApplication;
  nextOpenedUrl: () => Promise<string>;
};

type TestFixtures = {
  electronSession: ElectronSession;
  electronApp: ElectronApplication;
  mainWindow: Page;
  nextOpenedUrl: () => Promise<string>;
};

export const test = base.extend<TestFixtures>({
  async electronSession({playwright}, use, testInfo) {
    await using temporaryDir = await fs.promises.mkdtempDisposable(
      path.join(os.tmpdir(), "zulip-test-"),
    );
    using disposables = new DisposableStack();

    const env: Record<string, string> = {};
    for (const [name, value] of Object.entries(process.env)) {
      if (value !== undefined && name !== "ELECTRON_RUN_AS_NODE") {
        env[name] = value;
      }
    }

    let openedUrls: AsyncIterator<string> | undefined;
    if (process.platform === "linux") {
      // Electron opens external URLs by running xdg-open from PATH.  Put a
      // fake default browser there that sends each URL it is asked to open
      // through a named pipe.
      const binPath = path.join(temporaryDir.path, "bin");
      await fs.promises.mkdir(binPath);
      await fs.promises.writeFile(
        path.join(binPath, "xdg-open"),
        '#!/bin/sh\nprintf \'%s\\n\' "$*" > "$ZULIP_TEST_OPENED_URLS"\n',
        {mode: 0o755},
      );
      const openedUrlsPath = path.join(temporaryDir.path, "opened-urls");
      execFileSync("mkfifo", [openedUrlsPath]);
      // Opening the pipe read-write keeps a writer attached, so we never see
      // EOF and xdg-open never blocks.
      const openedUrlsSocket = new net.Socket({
        fd: fs.openSync(openedUrlsPath, "r+"),
        readable: true,
      });
      disposables.defer(() => {
        openedUrlsSocket.destroy();
      });
      const openedUrlsLines = disposables.use(
        readline.createInterface({input: openedUrlsSocket}),
      );
      openedUrls = openedUrlsLines[Symbol.asyncIterator]();
      env.PATH =
        env.PATH === undefined
          ? binPath
          : [binPath, env.PATH].join(path.delimiter);
      env.ZULIP_TEST_OPENED_URLS = openedUrlsPath;
    }

    await using electronApp = await playwright._electron.launch({
      args: [
        `--user-data-dir=${path.join(temporaryDir.path, "user-data")}`,
        path.join(import.meta.dirname, ".."),
      ],
      env,
    });

    const nextOpenedUrl = async (): Promise<string> => {
      assert.ok(openedUrls !== undefined);
      const result = await openedUrls.next();
      assert.ok(!result.done);
      return result.value;
    };

    const {tracing} = electronApp.context();
    await tracing.start({screenshots: true, snapshots: true});
    try {
      await use({electronApp, nextOpenedUrl});
    } finally {
      if (testInfo.status === testInfo.expectedStatus) {
        await tracing.stop();
      } else {
        const tracePath = path.join(temporaryDir.path, "trace.zip");
        await tracing.stop({path: tracePath});
        await testInfo.attach("trace", {
          path: tracePath,
          contentType: "application/zip",
        });
      }
    }
  },
  async electronApp({electronSession}, use) {
    await use(electronSession.electronApp);
  },
  async mainWindow({electronApp}, use) {
    await use(await electronApp.firstWindow());
  },
  async nextOpenedUrl({electronSession}, use) {
    await use(electronSession.nextOpenedUrl);
  },
});

export {expect} from "@playwright/test";
