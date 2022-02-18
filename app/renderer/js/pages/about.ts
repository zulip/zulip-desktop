import {remote} from "electron";

import {html} from "../../../common/html";

const {app} = remote;

export class AboutView {
  readonly $view: HTMLElement;

  constructor() {
    this.$view = document.createElement("div");
    const $shadow = this.$view.attachShadow({mode: "open"});
    $shadow.innerHTML = html`
      <link rel="stylesheet" href="css/about.css" />
      <!-- Initially hidden to prevent FOUC -->
      <div class="about" hidden>
        <img class="logo" src="../resources/zulip.png" />
        <p class="detail" id="version">v${app.getVersion()}</p>
        <div class="maintenance-info">
          <p class="detail maintainer">
            Maintained by
            <a
              href="https://zulip.com"
              target="_blank"
              rel="noopener noreferrer"
              >Zulip</a
            >
          </p>
          <p class="detail license">
            Available under the
            <a
              href="https://github.com/zulip/zulip-desktop/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              >Apache 2.0 License</a
            >
          </p>
        </div>
      </div>
    `.html;
  }

  destroy() {
    // Do nothing.
  }
}
