"use strict";
const test = require("tape");

const setup = require("../spectron_lib/common");

test("Settings", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDir();
  const app = setup.createApp();
  try {
    await setup.waitForLoad(app, t);
    await app.client.windowByIndex(0);
    await (await app.client.$("#settings-action")).click();
    await app.client.windowByIndex(1);
    await (await app.client.$("#tray-option")).waitForExist();
    await setup.wait(1000);
    await (
      await await (await app.client.$("#tray-option")).$(".setting-control")
    ).click();
    await setup.wait(1000);
    await (
      await await (await app.client.$("#tray-option")).$(".setting-control")
    ).click();
    await setup.wait(1000);
    if (process.platform !== "darwin") {
      await (
        await await (await app.client.$("#menubar-option")).$(
          ".setting-control",
        )
      ).click();
      await setup.wait(1000);
      await (
        await await (await app.client.$("#menubar-option")).$(
          ".setting-control",
        )
      ).click();
      await setup.wait(1000);
    }

    await (
      await await (await app.client.$("#sidebar-option")).$(".setting-control")
    ).click();
    await setup.wait(1000);
    await (
      await await (await app.client.$("#sidebar-option")).$(".setting-control")
    ).click();
    await setup.wait(1000);
    await (
      await await (await app.client.$("#badge-option")).$(".setting-control")
    ).click();
    await setup.wait(1000);
    await (
      await await (await app.client.$("#badge-option")).$(".setting-control")
    ).click();
    await setup.wait(1000);
    await setup.endTest(app, t);
  } catch (error) {
    await setup.endTest(app, t, error || "error");
  }
});
