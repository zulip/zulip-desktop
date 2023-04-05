import {shell} from "electron/common";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {html} from "./html.js";

import * as ConfigUtil from "./config-util.js";

/* Fetches the current protocolLaunchers from settings.json */
const protocolLaunchers = ConfigUtil.getConfigItem(
  "protocolLaunchers",
  new Map<string, string>(),
);

export async function openBrowser(url: URL): Promise<void> {
  if (["http:", "https:", "mailto:"].includes(url.protocol)) {
    await shell.openExternal(url.href);
  } else if (protocolLaunchers.has(url.protocol)) {
    // Custom protocol launchers based on a protocol-executable map
    const executable = protocolLaunchers.get(url.protocol);
    const command = url.pathname.replace(/^\/+/g, "") + url.search + url.hash;
    await shell.openExternal(String(executable) + " " + String(command));
  } else {
    // For security, indirect links to non-whitelisted protocols
    // through a real web browser via a local HTML file.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zulip-redirect-"));
    const file = path.join(dir, "redirect.html");
    fs.writeFileSync(
      file,
      html`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="Refresh" content="0; url=${url.href}" />
            <title>Redirecting</title>
            <style>
              html {
                font-family: menu, "Helvetica Neue", sans-serif;
              }
            </style>
          </head>
          <body>
            <p>Opening <a href="${url.href}">${url.href}</a>…</p>
          </body>
        </html>
      `.html,
    );
    await shell.openPath(file);
    setTimeout(() => {
      fs.unlinkSync(file);
      fs.rmdirSync(dir);
    }, 15_000);
  }
}
