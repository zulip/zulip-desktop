"use strict";
const test = require("tape");

const setup = require("../spectron_lib/common");

test("Reload", async (t) => {
  t.timeoutAfter(50e3);
  setup.resetTestDataDir();
  const app = setup.createApp();
  try {
    await setup.waitForLoad(app, t);
    await app.client.windowByIndex(0);
    await (await app.client.$("#reload-action")).click();
    await setup.wait(5000);
    await setup.endTest(app, t);
  } catch (error) {
    await setup.endTest(app, t, error || "error");
  }
});
