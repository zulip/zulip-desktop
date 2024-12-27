import * as backoff from "backoff";

import {html} from "../../../common/html.js";
import Logger from "../../../common/logger-util.js";
import type WebView from "../components/webview.js";
import {ipcRenderer} from "../typed-ipc-renderer.js";

const logger = new Logger({
  file: "domain-util.log",
});

export default class ReconnectUtil {
  url: string;
  alreadyReloaded: boolean;
  fibonacciBackoff: backoff.Backoff;

  constructor(webview: WebView) {
    this.url = webview.properties.url;
    this.alreadyReloaded = false;
    this.fibonacciBackoff = backoff.fibonacci({
      initialDelay: 5000,
      maxDelay: 300_000,
    });
  }

  async isOnline(): Promise<boolean> {
    return ipcRenderer.invoke("is-online", this.url);
  }

  pollInternetAndReload(): void {
    this.fibonacciBackoff.backoff();
    this.fibonacciBackoff.on("ready", async () => {
      if (await this._checkAndReload()) {
        this.fibonacciBackoff.reset();
      } else {
        this.fibonacciBackoff.backoff();
      }
    });
  }

  async _checkAndReload(): Promise<boolean> {
    if (this.alreadyReloaded) {
      return true;
    }

    if (await this.isOnline()) {
      ipcRenderer.send("forward-message", "reload-viewer");
      logger.log("You're back online.");
      return true;
    }

    logger.log(
      "There is no internet connection, try checking network cables, modem and router.",
    );
    const errorMessageHolder = document.querySelector("#description");
    if (errorMessageHolder) {
      errorMessageHolder.innerHTML = html`
        <div>Your internet connection doesn't seem to work properly!</div>
        <div>Verify that it works and then click try again.</div>
      `.html;
    }

    return false;
  }
}
