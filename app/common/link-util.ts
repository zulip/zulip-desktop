import { shell } from "electron/common";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as ConfigUtil from "./config-util.js";

import { html } from "./html.js";

/* Fetches the current protocolLaunchers from settings.json */
const protocolLaunchers = ConfigUtil.getConfigItem("protocolLaunchers", {});

export async function openBrowser(url: URL): Promise<void> {
  if (["http:", "https:", "mailto:"].includes(url.protocol)) {
    await shell.openExternal(url.href);
  } else if (protocolLaunchers.includes(url.protocol)) {
    // custom protocol launchers
    let executable = protocolLaunchers[url.protocol];
    let command = url.pathname.replace(/^\/+/g, "") + url.search + url.hash;
    await shell.openExternal(executable + " " + command);
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
