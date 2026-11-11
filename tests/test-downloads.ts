import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

import type {ElectronApplication} from "playwright-core";
import test from "tape";

import * as setup from "./setup.ts";

async function setCustomCss(
  app: ElectronApplication,
  css: string | null,
): Promise<void> {
  const userData = await app.evaluate(({app}) => app.getPath("userData"));
  const cssPath = path.join(userData, "downloads.css");
  if (css !== null) {
    await fs.writeFile(cssPath, css);
  }

  const settingsPath = path.join(userData, "config", "settings.json");
  const settings: unknown = JSON.parse(await fs.readFile(settingsPath, "utf8"));
  if (typeof settings !== "object" || settings === null) {
    throw new Error("Invalid test settings");
  }

  await fs.writeFile(
    settingsPath,
    JSON.stringify({...settings, customCSS: css === null ? "" : cssPath}),
  );
}

async function download(
  app: ElectronApplication,
  url: string,
  fileName: string,
  cancel = false,
): Promise<string> {
  const filePath = path.join(
    await app.evaluate(({app}) => app.getPath("userData")),
    fileName,
  );
  return app.evaluate(
    async ({session}, {url, filePath, cancel}) => {
      const downloads = session.fromPartition("persist:webviewsession");
      return new Promise<string>((resolve, reject) => {
        downloads.once("will-download", (_event, item) => {
          item.setSavePath(filePath);
          item.once("done", (_doneEvent, state) => {
            if (state === (cancel ? "cancelled" : "completed")) {
              resolve(filePath);
            } else {
              reject(new Error(`Unexpected download state: ${state}`));
            }
          });
          if (cancel) {
            item.cancel();
          }
        });
        downloads.downloadURL(url);
      });
    },
    {url, filePath, cancel},
  );
}

async function waitForRevealCount(
  app: ElectronApplication,
  count: number,
): Promise<void> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const revealedPaths: unknown = await app.evaluate(({shell}) =>
      Reflect.get(shell.showItemInFolder, "revealedPaths"),
    );
    if (Array.isArray(revealedPaths) && revealedPaths.length === count) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
  }

  throw new Error(`Timed out waiting for ${count} folder reveals`);
}

test("recent downloads popup", async (t) => {
  t.timeoutAfter(60e3);
  const fileName = `${"long-filename-".repeat(12)}.txt`;
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
    response.end("Downloaded file contents");
  });
  let app = await setup.createApp();
  const showFromMenu = async () => {
    await app.evaluate(({Menu}) => {
      const item = Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!;
      item.click();
    });
  };
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Test download server did not start");
    }

    const url = `http://127.0.0.1:${address.port}/file`;
    let window = await app.firstWindow();
    await window.waitForSelector("#connect");
    t.equal(await window.isVisible("#downloads-panel"), false);
    await showFromMenu();
    await window.waitForSelector("#downloads-panel");
    t.equal(
      await window.getAttribute("#close-downloads", "aria-label"),
      "Close",
      "icon-only close button has an accessible label",
    );
    t.equal(
      await window.textContent("#close-downloads .material-icons"),
      "close",
      "close button displays the X icon",
    );
    t.equal(
      await window.getAttribute(
        "#close-downloads .material-icons",
        "aria-hidden",
      ),
      "true",
      "close icon is hidden from assistive technology",
    );
    t.equal(
      await window.textContent("#downloads-list"),
      "No recent downloads.",
    );
    await window.click("#close-downloads");
    t.equal(
      await window.isVisible("#downloads-panel"),
      false,
      "X button closes the downloads popup",
    );

    await download(app, url, "cancelled.txt", true);
    t.equal(
      await window.isVisible("#downloads-panel"),
      false,
      "cancelled download does not show the popup",
    );

    const filePath = await download(app, url, fileName);
    await window.waitForSelector(".download-file");
    t.equal(await fs.readFile(filePath, "utf8"), "Downloaded file contents");
    t.equal(await window.textContent(".download-file"), fileName);
    t.equal(
      await window
        .locator(".download-file")
        .evaluate((element) => getComputedStyle(element).fontSize),
      "12px",
      "download filenames use compact text",
    );
    t.equal(
      await window
        .locator(".downloads-heading")
        .evaluate((element) => getComputedStyle(element).fontSize),
      "14px",
      "download heading uses compact text",
    );
    t.ok(
      await window.$eval(".download-file", (element) => {
        const style = getComputedStyle(element);
        return (
          style.textOverflow === "ellipsis" &&
          style.whiteSpace === "nowrap" &&
          element.scrollWidth > element.clientWidth
        );
      }),
      "long filenames are truncated with ellipsis",
    );
    t.equal(await window.getAttribute(".download-file", "title"), filePath);
    t.ok(
      await window.$eval(".download-row", (row) => {
        const bounds = row.getBoundingClientRect();
        return (
          Number.parseFloat(getComputedStyle(row).borderTopWidth) > 0 &&
          [...row.querySelectorAll("button")].every((button) => {
            const buttonBounds = button.getBoundingClientRect();
            return (
              getComputedStyle(button).borderTopWidth === "0px" &&
              buttonBounds.left > bounds.left &&
              buttonBounds.right < bounds.right &&
              buttonBounds.top > bounds.top &&
              buttonBounds.bottom < bounds.bottom
            );
          })
        );
      }),
      "filename and actions share a single enclosing row border",
    );
    t.ok(
      await window.$eval(".download-row", (row) => {
        const file = row
          .querySelector(".download-file")!
          .getBoundingClientRect();
        const actions = row.querySelector(".download-actions")!;
        const actionBounds = actions.getBoundingClientRect();
        const style = getComputedStyle(actions);
        return (
          file.right >= actionBounds.right &&
          file.left < actionBounds.left &&
          style.position === "absolute" &&
          Number.parseFloat(style.borderTopWidth) > 0 &&
          ["rgb(255, 255, 255)", "rgb(34, 34, 34)"].includes(
            style.backgroundColor,
          )
        );
      }),
      "filename extends behind an opaque, bordered action overlay",
    );
    t.ok(
      await window.$eval(".download-row", (row) =>
        [...row.querySelectorAll<HTMLElement>(".download-icon")].every(
          (icon) => {
            const button = icon.parentElement!.getBoundingClientRect();
            return (
              getComputedStyle(icon).fontSize === "14px" &&
              button.width === 24 &&
              button.height === 24
            );
          },
        ),
      ),
      "download icons are compact with 24px action buttons",
    );

    await app.evaluate(({shell}) => {
      const revealedPaths: string[] = [];
      shell.showItemInFolder = Object.assign(
        (filePath: string) => {
          revealedPaths.push(filePath);
        },
        {revealedPaths},
      );
    });
    const revealButton = window.locator(".reveal-download");
    await window.locator("#downloads-heading").hover();
    t.equal(
      await revealButton.evaluate(
        (element) => getComputedStyle(element.parentElement!).opacity,
      ),
      "0",
      "folder icon is hidden when the row is not hovered",
    );
    await window.locator(".download-row").hover();
    t.equal(
      await revealButton.evaluate(
        (element) => getComputedStyle(element.parentElement!).opacity,
      ),
      "1",
      "folder icon appears on hover",
    );
    t.equal(
      await revealButton.getAttribute("aria-label"),
      `Show ${fileName} in folder`,
    );
    await revealButton.click();
    await waitForRevealCount(app, 1);
    t.deepEqual(
      await app.evaluate(({shell}) =>
        Reflect.get(shell.showItemInFolder, "revealedPaths"),
      ),
      [filePath],
      "folder icon reveals the selected file",
    );
    await window.locator("#downloads-heading").hover();
    await revealButton.focus();
    t.equal(
      await revealButton.evaluate(
        (element) => getComputedStyle(element.parentElement!).opacity,
      ),
      "1",
      "folder icon is visible to keyboard users",
    );
    await window.keyboard.press("Enter");
    await waitForRevealCount(app, 2);
    t.deepEqual(
      await app.evaluate(({shell}) =>
        Reflect.get(shell.showItemInFolder, "revealedPaths"),
      ),
      [filePath, filePath],
      "keyboard activation reveals the file",
    );

    await app.evaluate(({shell}, expectedPath) => {
      shell.openPath = async (filePath) => {
        if (filePath !== expectedPath) {
          throw new Error("Wrong downloaded file opened");
        }

        return "Test open error";
      };
    }, filePath);
    await window.click(".download-file");
    await window.waitForSelector("#downloads-error");
    t.ok(
      (await window.textContent("#downloads-error"))!.includes(
        "Test open error",
      ),
      "file click calls openPath and surfaces errors",
    );
    await app.evaluate(({shell}) => {
      shell.openPath = async () => "";
    });
    await window.click(".download-file");
    t.equal(
      await window.isVisible("#downloads-error"),
      false,
      "successfully opening a file clears the error",
    );
    await window.keyboard.press("Escape");
    t.equal(await window.isVisible("#downloads-panel"), false);

    await download(app, url, "newest.txt");
    await window.waitForSelector(".download-file");
    t.deepEqual(
      await window.locator(".download-file").allTextContents(),
      ["newest.txt", fileName],
      "newest download is first",
    );
    await window.locator(".download-row").first().hover();
    await window.locator(".reveal-download").first().click();
    await waitForRevealCount(app, 3);
    t.deepEqual(
      await app.evaluate(({shell}) =>
        Reflect.get(shell.showItemInFolder, "revealedPaths"),
      ),
      [filePath, filePath, path.join(path.dirname(filePath), "newest.txt")],
      "each folder icon reveals its own file",
    );
    await download(app, url, "newest.txt");
    t.equal(
      await window.locator(".download-file").count(),
      2,
      "downloading to the same path does not duplicate history",
    );

    app = await setup.restartApp(app);
    window = await app.firstWindow();
    await window.waitForSelector("#connect");
    t.equal(
      await window.isVisible("#downloads-panel"),
      false,
      "history does not automatically open on startup",
    );
    await showFromMenu();
    await window.waitForSelector(".download-file");
    t.deepEqual(
      await window.locator(".download-file").allTextContents(),
      ["newest.txt", fileName],
      "history survives restarting the app",
    );
    await fs.unlink(path.join(path.dirname(filePath), "newest.txt"));
    await window.locator(".download-row").first().hover();
    await window.locator(".reveal-download").first().click();
    await window.waitForSelector("#downloads-error");
    t.equal(
      await window.textContent("#downloads-error"),
      "Unable to show downloaded file in folder.",
      "revealing a removed file displays an error",
    );
    await window.locator(".download-file").first().click();
    await window.waitForFunction(() =>
      document
        .querySelector("#downloads-error")
        ?.textContent?.includes("Unable to open downloaded file:"),
    );
    t.ok(
      await window.textContent("#downloads-error"),
      "opening a removed file displays an error",
    );
    await setCustomCss(
      app,
      ".downloads-panel { font-size: 10px; } .downloads-panel .download-file { color: rgb(1, 2, 3); }",
    );
    await showFromMenu();
    await window.waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".download-file")!).fontSize ===
        "10px",
    );
    t.equal(
      await window
        .locator(".download-file")
        .first()
        .evaluate((element) => getComputedStyle(element).color),
      "rgb(1, 2, 3)",
      "uploaded CSS styles download classes",
    );
    await setCustomCss(app, null);
    await showFromMenu();
    await window.waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".download-file")!).fontSize ===
        "12px",
    );
    t.pass("removing uploaded CSS restores compact defaults");
  } finally {
    await setup.endTest(app);
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
});

test("recent downloads are limited to 100 files", async (t) => {
  t.timeoutAfter(60e3);
  let downloadResponse: http.ServerResponse | undefined;
  const server = http.createServer((_request, response) => {
    downloadResponse = response;
    response.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Length": "1000",
    });
    response.write(Buffer.alloc(100, "a"));
  });
  let app = await setup.createApp();
  try {
    const window = await app.firstWindow();
    await window.waitForSelector("#connect");
    const userData = await app.evaluate(({app}) => app.getPath("userData"));
    const settingsPath = path.join(userData, "config", "settings.json");
    const settings: unknown = JSON.parse(
      await fs.readFile(settingsPath, "utf8"),
    );
    assert.ok(typeof settings === "object" && settings !== null);
    const history = Array.from({length: 105}, (_, index) => ({
      filePath: path.join(userData, `previous-${index}.txt`),
      fileName: `previous-${index}.txt`,
    }));
    const oldestPath = history.at(-1)!.filePath;
    await fs.writeFile(oldestPath, "Keep this downloaded file");
    await fs.writeFile(
      settingsPath,
      JSON.stringify({...settings, recentDownloads: history}),
    );
    const readHistory = async (): Promise<unknown> => {
      const settings: unknown = JSON.parse(
        await fs.readFile(settingsPath, "utf8"),
      );
      assert.ok(
        typeof settings === "object" &&
          settings !== null &&
          "recentDownloads" in settings,
      );
      return settings.recentDownloads;
    };

    app = await setup.restartApp(app);
    const restartedWindow = await app.firstWindow();
    await restartedWindow.waitForSelector("#connect");
    await app.evaluate(({Menu}) => {
      Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!
        .click();
    });
    await restartedWindow.waitForSelector(".download-file");
    t.deepEqual(
      await restartedWindow.locator(".download-file").allTextContents(),
      history.slice(0, 100).map((download) => download.fileName),
      "existing oversized history displays only the newest 100 files",
    );
    t.deepEqual(
      await readHistory(),
      history.slice(0, 100),
      "existing oversized saved history is trimmed at startup",
    );

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address !== null && typeof address !== "string");
    const completed = download(
      app,
      `http://127.0.0.1:${address.port}/file`,
      "newest.txt",
    );
    await restartedWindow.waitForSelector(".download-active");
    t.equal(
      await restartedWindow.locator(".download-row").count(),
      100,
      "active downloads count toward the 100 displayed files",
    );
    t.equal(
      await restartedWindow.locator(".download-file").first().textContent(),
      "newest.txt",
      "the active download appears first",
    );
    assert.ok(downloadResponse);
    downloadResponse.end(Buffer.alloc(900, "b"));
    const filePath = await completed;
    await restartedWindow.waitForFunction(
      () => document.querySelectorAll(".download-active").length === 0,
    );
    const expectedHistory = [
      {filePath, fileName: "newest.txt"},
      ...history.slice(0, 99),
    ];
    t.deepEqual(
      await restartedWindow.locator(".download-file").allTextContents(),
      expectedHistory.map((download) => download.fileName),
      "a completed download evicts the oldest entry from the list",
    );
    t.deepEqual(
      await readHistory(),
      expectedHistory,
      "saved history retains exactly the newest 100 files",
    );
    t.equal(
      await fs.readFile(oldestPath, "utf8"),
      "Keep this downloaded file",
      "evicting a history entry does not delete the downloaded file",
    );
    t.ok(
      await restartedWindow.$eval("#clear-downloads", (button) => {
        const bounds = button.getBoundingClientRect();
        const listBounds = document
          .querySelector("#downloads-list")!
          .getBoundingClientRect();
        return bounds.top >= listBounds.bottom && bounds.bottom <= innerHeight;
      }),
      "Clear remains visible below the scrolling list",
    );
    await restartedWindow.focus("#clear-downloads");
    await restartedWindow.keyboard.press("Enter");
    await restartedWindow.waitForSelector(".downloads-empty");
    t.equal(
      await restartedWindow.locator(".download-row").count(),
      0,
      "Clear removes all completed entries",
    );
    t.deepEqual(await readHistory(), [], "Clear empties the saved history");
    t.equal(
      await fs.readFile(filePath, "utf8"),
      "a".repeat(100) + "b".repeat(900),
      "Clear keeps downloaded files on disk",
    );
    app = await setup.restartApp(app);
    const clearedWindow = await app.firstWindow();
    await clearedWindow.waitForSelector("#connect");
    await app.evaluate(({Menu}) => {
      Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!
        .click();
    });
    await clearedWindow.waitForSelector(".downloads-empty");
    t.equal(
      await clearedWindow.locator(".download-row").count(),
      0,
      "cleared history stays empty after restarting",
    );
  } finally {
    downloadResponse?.destroy();
    await setup.endTest(app);
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
});

test("active download progress", async (t) => {
  t.timeoutAfter(60e3);
  const responses = new Map<string, http.ServerResponse>();
  const server = http.createServer((request, response) => {
    const fileName = request.url!.slice(1);
    responses.set(fileName, response);
    response.writeHead(200, {
      "Content-Type": "application/octet-stream",
      ...(fileName === "unknown.txt" ? {} : {"Content-Length": "1000"}),
    });
    response.write(Buffer.alloc(100, "a"));
  });
  let app = await setup.createApp();
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Test download server did not start");
    }

    const userData = await app.evaluate(({app}) => app.getPath("userData"));
    const startDownload = async (fileName: string, cancel = false) => {
      await app.evaluate(
        ({session}, {url, filePath, cancel}) => {
          const downloads = session.fromPartition("persist:webviewsession");
          downloads.once("will-download", (_event, item) => {
            item.setSavePath(filePath);
            if (cancel) {
              item.on("updated", () => {
                if (item.getReceivedBytes() >= 500) {
                  item.cancel();
                }
              });
            }
          });
          downloads.downloadURL(url);
        },
        {
          url: `http://127.0.0.1:${address.port}/${fileName}`,
          filePath: path.join(userData, fileName),
          cancel,
        },
      );
    };
    let window = await app.firstWindow();
    await window.waitForSelector("#connect");
    await startDownload("slow.md");
    await window.waitForFunction(
      () =>
        document.querySelector(".download-progress")?.textContent ===
        "(10 % downloaded)",
    );
    t.equal(
      await window.textContent(".download-file"),
      "slow.md",
      "active download appears before completion",
    );
    t.equal(await window.locator(".download-active").count(), 1);
    t.ok(
      await window
        .locator(".download-active")
        .evaluate(
          (element) =>
            getComputedStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)",
        ),
      "active row has a visible highlight",
    );
    t.equal(
      await window.locator(".download-row button:disabled").count(),
      3,
      "open, reveal and delete are disabled until completion",
    );
    await window.click("#close-downloads");
    responses.get("slow.md")!.write(Buffer.alloc(400, "b"));
    await window.waitForFunction(
      () =>
        document.querySelector(".download-progress")?.textContent ===
        "(50 % downloaded)",
    );
    t.notOk(
      await window.isVisible("#downloads-panel"),
      "progress updates do not reopen a dismissed panel",
    );
    await app.evaluate(({Menu}) => {
      Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!
        .click();
    });
    await window.waitForSelector("#downloads-panel");
    t.equal(
      await window.textContent(".download-progress"),
      "(50 % downloaded)",
      "reopening the panel includes current progress",
    );
    await startDownload("cancelled.txt", true);
    await window.waitForFunction(
      () => document.querySelectorAll(".download-active").length === 2,
    );
    t.equal(
      await window.locator(".download-file").first().textContent(),
      "cancelled.txt",
      "new concurrent download is first",
    );
    t.deepEqual(
      await window
        .locator(".download-highlighted .download-file")
        .allTextContents(),
      ["cancelled.txt"],
      "only the newest concurrent download is highlighted",
    );
    responses.get("cancelled.txt")!.write(Buffer.alloc(400, "b"));
    await window.waitForFunction(
      () => document.querySelectorAll(".download-row").length === 1,
    );
    t.equal(
      await window.textContent(".download-file"),
      "slow.md",
      "cancelling removes only the cancelled download",
    );
    t.deepEqual(
      await window
        .locator(".download-highlighted .download-file")
        .allTextContents(),
      ["slow.md"],
      "cancelling restores the highlight to the remaining active download",
    );
    responses.get("slow.md")!.end(Buffer.alloc(500, "c"));
    await window.waitForFunction(
      () =>
        document.querySelectorAll(".download-active").length === 0 &&
        document.querySelectorAll(".download-row button:disabled").length === 0,
    );
    t.notOk(
      await window.isVisible(".download-progress"),
      "progress disappears on completion",
    );
    t.equal(
      await window.locator(".download-highlighted").count(),
      1,
      "the completed file stays highlighted",
    );
    await window.click("#close-downloads");
    await app.evaluate(({Menu}) => {
      Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!
        .click();
    });
    await window.waitForSelector("#downloads-panel");
    t.equal(
      await window.locator(".download-highlighted").count(),
      1,
      "the highlight survives reopening the panel",
    );
    await startDownload("unknown.txt");
    await window.waitForFunction(
      () =>
        document.querySelector(".download-progress")?.textContent ===
        "(Downloading...)",
    );
    t.pass("unknown download sizes show an indeterminate label");
    t.deepEqual(
      await window
        .locator(".download-highlighted .download-file")
        .allTextContents(),
      ["unknown.txt"],
      "starting another download clears the previous completed file highlight",
    );
    await window.click("#clear-downloads");
    await window.waitForFunction(
      () => document.querySelectorAll(".download-row").length === 1,
    );
    t.equal(
      await window.textContent(".download-active .download-file"),
      "unknown.txt",
      "Clear removes completed history but keeps running downloads visible",
    );
    t.equal(
      await window.textContent(".download-progress"),
      "(Downloading...)",
      "Clear preserves download progress",
    );
    responses.get("unknown.txt")!.end("done");
    await window.waitForFunction(
      () => document.querySelectorAll(".download-active").length === 0,
    );
    t.deepEqual(
      await window
        .locator(".download-highlighted .download-file")
        .allTextContents(),
      ["unknown.txt"],
      "only the most recently completed download stays highlighted",
    );
    app = await setup.restartApp(app);
    window = await app.firstWindow();
    await window.waitForSelector("#connect");
    await app.evaluate(({Menu}) => {
      Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!
        .click();
    });
    await window.waitForSelector(".download-file");
    t.deepEqual(
      await window.locator(".download-file").allTextContents(),
      ["unknown.txt"],
      "downloads completed after Clear persist without the cleared history",
    );
    t.equal(await window.locator(".download-active").count(), 0);
    t.equal(
      await window.locator(".download-highlighted").count(),
      0,
      "previous-session files are not highlighted",
    );
  } finally {
    for (const response of responses.values()) {
      response.destroy();
    }

    await setup.endTest(app);
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
});

test("delete downloaded files", async (t) => {
  t.timeoutAfter(60e3);
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {"Content-Type": "application/octet-stream"});
    response.end("Downloaded file contents");
  });
  let app = await setup.createApp();
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Test download server did not start");
    }

    const url = `http://127.0.0.1:${address.port}/file`;
    let window = await app.firstWindow();
    await window.waitForSelector("#connect");
    const keptPath = await download(app, url, "keep.txt");
    const deletedPath = await download(app, url, "delete.txt");
    await window.waitForFunction(
      () => document.querySelectorAll(".download-row").length === 2,
    );
    const deleteButton = window.locator(".delete-download").first();
    await window.locator("#downloads-heading").hover();
    t.equal(
      await deleteButton.evaluate(
        (element) => getComputedStyle(element.parentElement!).opacity,
      ),
      "0",
      "trash icon is hidden when not hovered",
    );
    await window.locator(".download-row").first().hover();
    t.equal(
      await deleteButton.evaluate(
        (element) => getComputedStyle(element.parentElement!).opacity,
      ),
      "1",
      "trash icon appears on hover",
    );
    t.equal(await deleteButton.getAttribute("aria-label"), "Delete delete.txt");

    const confirmDeletion = async (response: number) => {
      await app.evaluate(({dialog}, response) => {
        dialog.showMessageBox = async (
          ...args:
            | [Electron.MessageBoxOptions]
            | [Electron.BaseWindow, Electron.MessageBoxOptions]
        ) => {
          const options = args.length === 2 ? args[1] : args[0];
          Reflect.set(dialog, "downloadDeletePrompt", options);
          return {response, checkboxChecked: false};
        };
      }, response);
    };
    await confirmDeletion(1);
    await deleteButton.click();
    await app.evaluate(async ({dialog}) => {
      const deadline = Date.now() + 5000;
      while (!Reflect.has(dialog, "downloadDeletePrompt")) {
        if (Date.now() >= deadline) {
          throw new Error("No deletion confirmation shown");
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
      }
    });
    t.deepEqual(
      await app.evaluate(({dialog}) =>
        Reflect.get(dialog, "downloadDeletePrompt"),
      ),
      {
        type: "warning",
        buttons: ["Delete", "Cancel"],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
        message: "Are you sure you want to delete delete.txt?",
        detail: "The file will be moved to the trash.\n" + deletedPath,
      },
      "confirmation identifies the file and defaults to Cancel",
    );
    t.equal(
      await fs.readFile(deletedPath, "utf8"),
      "Downloaded file contents",
      "cancelling keeps the file",
    );
    t.equal(
      await window.locator(".download-row").count(),
      2,
      "cancelling keeps the history entry",
    );

    await confirmDeletion(0);
    await window.locator("#downloads-heading").hover();
    await deleteButton.focus();
    t.equal(
      await deleteButton.evaluate(
        (element) => getComputedStyle(element.parentElement!).opacity,
      ),
      "1",
      "trash icon is visible on keyboard focus",
    );
    await window.keyboard.press("Enter");
    await window.waitForFunction(
      () => document.querySelectorAll(".download-row").length === 1,
    );
    await assert.rejects(fs.access(deletedPath), {code: "ENOENT"});
    t.pass("confirmed deletion moves the file out of its download location");
    t.equal(
      await fs.readFile(keptPath, "utf8"),
      "Downloaded file contents",
      "deleting affects only the selected file",
    );
    t.equal(await window.textContent(".download-file"), "keep.txt");

    const blockedPath = await download(app, url, "blocked.txt");
    await window.waitForFunction(
      () => document.querySelectorAll(".download-row").length === 2,
    );
    await app.evaluate(({shell}) => {
      shell.trashItem = async () => {
        throw new Error("Test trash failure");
      };
    });
    await window.locator(".download-row").first().hover();
    await window.locator(".delete-download").first().click();
    await window.waitForSelector("#downloads-error");
    t.equal(
      await window.textContent("#downloads-error"),
      "Unable to delete downloaded file.",
      "trash failures are shown to the user",
    );
    t.equal(await window.locator(".download-row").count(), 2);
    t.equal(await fs.readFile(blockedPath, "utf8"), "Downloaded file contents");

    app = await setup.restartApp(app);
    window = await app.firstWindow();
    await window.waitForSelector("#connect");
    await app.evaluate(({Menu}) => {
      Menu.getApplicationMenu()!
        .items.flatMap((item) => item.submenu?.items ?? [])
        .find((item) => item.label === "Recent Downloads")!
        .click();
    });
    await window.waitForSelector(".download-file");
    t.deepEqual(
      await window.locator(".download-file").allTextContents(),
      ["blocked.txt", "keep.txt"],
      "successful deletion removes history permanently; failed deletion does not",
    );
  } finally {
    await setup.endTest(app);
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
});

test("Markdown downloads use the standard file actions", async (t) => {
  t.timeoutAfter(60e3);
  const server = http.createServer((_request, response) => {
    response.writeHead(200, {"Content-Type": "application/octet-stream"});
    response.end("# Downloaded Markdown");
  });
  const app = await setup.createApp();
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Test download server did not start");
    }

    const url = `http://127.0.0.1:${address.port}/file`;
    const window = await app.firstWindow();
    await window.waitForSelector("#connect");
    const filePath = await download(app, url, "example.MD");
    await window.waitForSelector(".download-file");
    t.equal(await fs.readFile(filePath, "utf8"), "# Downloaded Markdown");
    t.equal(await window.textContent(".download-file"), "example.MD");
    t.deepEqual(
      await window
        .locator(".download-actions button")
        .evaluateAll((buttons) => buttons.map((button) => button.className)),
      ["reveal-download", "delete-download"],
      "Markdown files have only the standard download actions",
    );
    await app.evaluate(({shell}, expectedPath) => {
      shell.openPath = async (filePath) => {
        if (filePath !== expectedPath) {
          throw new Error("Wrong downloaded file opened");
        }

        return "Test Markdown open error";
      };
    }, filePath);
    await window.click(".download-file");
    await window.waitForSelector("#downloads-error");
    t.equal(
      await window.textContent("#downloads-error"),
      "Unable to open downloaded file: Test Markdown open error",
      "clicking Markdown opens the file with the system application",
    );
  } finally {
    await setup.endTest(app);
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }
});
