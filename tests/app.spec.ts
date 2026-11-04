import {createServer} from "node:http";

import {expect, test} from "./fixtures.ts";

test("app runs", async ({mainWindow}) => {
  await expect(mainWindow).toHaveTitle("Zulip");
  await expect(mainWindow.locator("#connect")).toBeVisible();
});

test("add organization", async ({electronApp, mainWindow}) => {
  let serverPort = 0;
  const server = createServer((request, response) => {
    if (request.url === "/api/v1/server_settings") {
      const serverUrl = `http://127.0.0.1:${serverPort}`;
      const serverSettings = new Map<string, string | number>([
        ["realm_name", "Test Organization"],
        ["realm_uri", serverUrl],
        ["realm_icon", `${serverUrl}/realm-icon.png`],
        ["zulip_version", "10.0"],
        ["zulip_feature_level", 100],
      ]);
      response
        .writeHead(200, {"Content-Type": "application/json"})
        .end(JSON.stringify(Object.fromEntries(serverSettings)));
    } else if (request.url === "/realm-icon.png") {
      response.writeHead(200, {"Content-Type": "image/png"}).end();
    } else {
      response
        .writeHead(200, {"Content-Type": "text/html"})
        .end('<input id="id_username" />');
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    await new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
    throw new TypeError("Failed to start test Zulip server");
  }

  serverPort = address.port;

  try {
    await expect(mainWindow).toHaveTitle("Zulip");
    await mainWindow.fill(
      ".setting-input-value",
      `http://127.0.0.1:${address.port}`,
    );
    await mainWindow.click("#connect");

    const organizationWindow = await electronApp.waitForEvent("window");
    await expect(organizationWindow.locator("#id_username")).toBeVisible();
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
});

test("settings navigation opens network settings", async ({mainWindow}) => {
  await mainWindow.locator("#settings-action").click();
  await mainWindow.locator("#nav-Network").click();

  await expect(mainWindow).toHaveURL(/#Network$/v);
  await expect(mainWindow.getByText("Proxy", {exact: true})).toBeVisible();
});

test("create organization link is available", async ({mainWindow}) => {
  await expect(mainWindow.locator("#open-create-org-link")).toBeVisible();
});
