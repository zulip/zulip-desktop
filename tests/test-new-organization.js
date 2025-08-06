import Fifo from "p-fifo";
import test from "tape";

import * as setup from "./setup.js";

// Create new org link should open in the default browser [WIP]

test("new-org-link", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDirectory();
  const app = await setup.createApp();
  try {
    const windows = new Fifo();
    for (const win of app.windows()) windows.push(win);
    app.on("window", (win) => windows.push(win));

    const mainWindow = await windows.shift();
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.click("#open-create-org-link");
  } finally {
    await setup.endTest(app);
  }
});
