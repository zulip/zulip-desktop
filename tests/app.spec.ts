import {once} from "node:events";
import {createServer} from "node:http";
import process from "node:process";

import {expect, test} from "./fixtures.ts";

test("app runs and create organization link is available", async ({
  mainWindow,
}) => {
  await expect(mainWindow).toHaveTitle("Zulip");
  await expect(mainWindow.locator("#connect")).toBeVisible();
  await expect(mainWindow.locator("#open-create-org-link")).toBeVisible();
});

test.describe("create organization link", () => {
  test.skip(
    process.platform !== "linux",
    "Fake xdg-open browser check is Linux-only.",
  );

  // Create new org link should open in the default browser.  This relies on
  // the fake xdg-open from fixtures.ts.
  test("opens the default browser", async ({mainWindow, nextOpenedUrl}) => {
    await expect(mainWindow).toHaveTitle("Zulip");
    await mainWindow.locator("#open-create-org-link").click();

    expect(await nextOpenedUrl()).toBe("https://zulip.com/new/");
  });
});

test("add organization", async ({electronApp, mainWindow}) => {
  let baseUrl = "";
  const server = createServer((request, response) => {
    if (request.url === "/api/v1/server_settings") {
      const serverSettings = {
        /* eslint-disable @typescript-eslint/naming-convention -- API field names are snake_case. */
        realm_name: "Test Organization",
        realm_uri: baseUrl,
        realm_icon: `${baseUrl}/realm-icon.png`,
        zulip_version: "10.0",
        zulip_feature_level: 100,
        /* eslint-enable @typescript-eslint/naming-convention */
      };
      response
        .writeHead(200, {"Content-Type": "application/json"})
        .end(JSON.stringify(serverSettings));
    } else if (request.url === "/realm-icon.png") {
      response.writeHead(200, {"Content-Type": "image/png"}).end();
    } else {
      response
        .writeHead(200, {"Content-Type": "text/html"})
        .end('<input id="id_username" />');
    }
  });

  await once(server.listen(0, "127.0.0.1"), "listening");

  try {
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new TypeError("Failed to start test Zulip server");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;

    await expect(mainWindow).toHaveTitle("Zulip");
    await mainWindow.fill(".setting-input-value", baseUrl);
    const [organizationWindow] = await Promise.all([
      electronApp.waitForEvent("window"),
      mainWindow.click("#connect"),
    ]);
    await expect(organizationWindow.locator("#id_username")).toBeVisible();
  } finally {
    const closePromise = once(server, "close");
    server.close();
    await closePromise;
  }
});

test("settings navigation opens network settings", async ({mainWindow}) => {
  await mainWindow.locator("#settings-action").click();
  await mainWindow.locator("#nav-Network").click();

  await expect(mainWindow).toHaveURL(/#Network$/v);
  await expect(mainWindow.getByText("Proxy", {exact: true})).toBeVisible();
});
