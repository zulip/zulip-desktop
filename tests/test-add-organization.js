import Fifo from "p-fifo";
import test from "tape";

import * as setup from "./setup.js";

test("add-organization", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDirectory();
  const app = await setup.createApp();
  try {
    const windows = new Fifo();
    for (const win of app.windows()) windows.push(win);
    app.on("window", (win) => windows.push(win));

    const mainWindow = await windows.shift();
    t.equal(await mainWindow.title(), "Zulip");

    await mainWindow.fill(
      ".setting-input-value",
      "zulip-desktop-test.zulipchat.com",
    );
    await mainWindow.click("#connect");

    const orgWebview = await windows.shift();
    await orgWebview.waitForSelector("#id_username");
  } finally {
    await setup.endTest(app);
  }
});
