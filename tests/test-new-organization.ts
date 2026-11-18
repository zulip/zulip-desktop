import process from "node:process";

import Fifo from "p-fifo";
import type {Page} from "playwright-core";
import test from "tape";

import * as setup from "./setup.ts";

// Create new org link should open in the default browser.  This relies on
// the fake xdg-open from setup.ts.
test("new-org-link", {skip: process.platform !== "linux"}, async (t) => {
  t.timeoutAfter(50e3);
  const app = await setup.createApp();
  try {
    const windows = new Fifo<Page>();
    for (const win of app.windows()) {
      void windows.push(win);
    }

    app.on("window", async (win) => windows.push(win));

    const mainWindow = await windows.shift();
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.click("#open-create-org-link");

    t.equal(await setup.nextOpenedUrl(), "https://zulip.com/new/");
  } finally {
    await setup.endTest(app);
  }
});
