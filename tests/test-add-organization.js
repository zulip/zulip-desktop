import {chan, put, take} from "medium";
import test from "tape";

import * as setup from "./setup.js";

test("add-organization", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDirectory();
  const app = await setup.createApp();
  try {
    const windows = chan();
    for (const win of app.windows()) put(windows, win);
    app.on("window", (win) => put(windows, win));

    const mainWindow = await take(windows);
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.fill(
      ".setting-input-value",
      "zulip-desktop-test.zulipchat.com",
    );
    await mainWindow.click("#connect");

    const orgWebview = await take(windows);
    await orgWebview.waitForSelector("#id_username");
  } finally {
    await setup.endTest(app);
  }
});
