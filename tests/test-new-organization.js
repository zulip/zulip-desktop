import {chan, put, take} from "medium";
import test from "tape";

import * as setup from "./setup.js";

// Create new org link should open in the default browser [WIP]

test("new-org-link", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDirectory();
  const app = await setup.createApp();
  try {
    const windows = chan();
    for (const win of app.windows()) put(windows, win);
    app.on("window", (win) => put(windows, win));

    const mainWindow = await take(windows);
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.click("#open-create-org-link");
  } finally {
    await setup.endTest(app);
  }
});
