import {chan, put, take} from "medium";
import test from "tape";

import * as setup from "./setup.js";

test("app runs", async (t) => {
  t.timeoutAfter(10e3);
  setup.resetTestDataDirectory();
  const app = await setup.createApp();
  try {
    const windows = chan();
    for (const win of app.windows()) put(windows, win);
    app.on("window", (win) => put(windows, win));

    const mainWindow = await take(windows);
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.waitForSelector("#connect");
  } finally {
    await setup.endTest(app);
  }
});
