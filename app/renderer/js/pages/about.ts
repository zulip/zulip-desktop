import {app} from "@electron/remote";

import {bundleUrl} from "../../../common/paths.js";

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
  }

  destroy() {
    // Do nothing.
  }
}
