import {app} from "@electron/remote";

import {Html, html} from "../../../common/html.js";
import {bundleUrl} from "../../../common/paths.js";
import * as t from "../../../common/translation-util.js";
import {generateNodeFromHtml} from "../components/base.js";

export class AboutView {
  static async create(): Promise<AboutView> {
    return new AboutView(
      await (await fetch(new URL("app/renderer/about.html", bundleUrl))).text(),
    );
  }

  readonly $view: HTMLElement;

  private constructor(templateHtml: string) {
    this.$view = document.createElement("div");
    const $shadow = this.$view.attachShadow({mode: "open"});
    $shadow.innerHTML = templateHtml;
    $shadow.querySelector("#version")!.textContent = `v${app.getVersion()}`;
    const maintenanceInfoHtml = html`
      <div class="maintenance-info">
        <p class="detail maintainer">
          ${new Html({
            html: t.__("Maintained by {{{link}}}Zulip{{{endLink}}}", {
              link: '<a href="https://zulip.com" target="_blank" rel="noopener noreferrer">',
              endLink: "</a>",
            }),
          })}
        </p>
        <p class="detail license">
          ${new Html({
            html: t.__(
              "Available under the {{{link}}}Apache 2.0 License{{{endLink}}}",
              {
                link: '<a href="https://github.com/zulip/zulip-desktop/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">',
                endLink: "</a>",
              },
            ),
          })}
        </p>
      </div>
    `;
    $shadow
      .querySelector(".about")!
      .append(generateNodeFromHtml(maintenanceInfoHtml));
  }

  destroy() {
    // Do nothing.
  }
}
