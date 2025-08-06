import Fifo from "p-fifo";
import type {Page} from "playwright-core";
import test from "tape";

import * as setup from "./setup.ts";

test("app runs", async (t) => {
  t.timeoutAfter(10e3);
  setup.resetTestDataDirectory();
  const app = await setup.createApp();
  try {
    const windows = new Fifo<Page>();
    for (const win of app.windows()) void windows.push(win);
    app.on("window", async (win) => windows.push(win));

    const mainWindow = await windows.shift();
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.waitForSelector("#connect");
  } finally {
    await setup.endTest(app);
  }
});
