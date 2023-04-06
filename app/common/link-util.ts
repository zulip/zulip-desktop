import {shell} from "electron/common";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as ConfigUtil from "./config-util.js";
import {html} from "./html.js";

/* Fetches the current protocolLaunchers from settings.json */
const whitelistedProtocols = ConfigUtil.getConfigItem("whitelistedProtocols", [
  "http:",
  "https:",
  "mailto:",
]);

export async function openBrowser(url: URL): Promise<void> {
  if (whitelistedProtocols.includes(url.protocol)) {
    await shell.openExternal(url.href);
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
