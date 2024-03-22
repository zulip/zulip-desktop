import process from "node:process";

import {type Html, html} from "../../../common/html.js";
import {ipcRenderer} from "../typed-ipc-renderer.js";

import {generateNodeFromHtml} from "./base.js";
import Tab, {type TabProperties} from "./tab.js";
import type WebView from "./webview.js";

export type ServerTabProperties = {
  webview: Promise<WebView>;
} & TabProperties;

export default class ServerTab extends Tab {
  webview: Promise<WebView>;
  $el: Element;
  $name: Element;
  $icon: HTMLImageElement;
  $badge: Element;

  constructor({webview, ...properties}: ServerTabProperties) {
    super(properties);

    this.webview = webview;
    this.$el = generateNodeFromHtml(this.templateHtml());
    this.properties.$root.append(this.$el);
    this.registerListeners();
    this.$name = this.$el.querySelector(".server-tooltip")!;
    this.$icon = this.$el.querySelector(".server-icons")!;
    this.$badge = this.$el.querySelector(".server-tab-badge")!;
  }

  override async activate(): Promise<void> {
    await super.activate();
    (await this.webview).load();
  }

  override async deactivate(): Promise<void> {
    await super.deactivate();
    (await this.webview).hide();
  }

  override async destroy(): Promise<void> {
    await super.destroy();
    (await this.webview).destroy();
  }

  templateHtml(): Html {
    return html`
      <div class="tab" data-tab-id="${this.properties.tabIndex}">
        <div class="server-tooltip" style="display:none">
          ${this.properties.name}
        </div>
        <div class="server-tab-badge"></div>
        <div class="server-tab">
          <img class="server-icons" src="${this.properties.icon}" />
        </div>
        <div class="server-tab-shortcut">${this.generateShortcutText()}</div>
      </div>
    `;
  }

  setName(name: string): void {
    this.properties.name = name;
    this.$name.textContent = name;
  }

  setIcon(icon: string): void {
    this.properties.icon = icon;
    this.$icon.src = icon;
  }

  updateBadge(count: number): void {
    this.$badge.textContent = count > 999 ? "1K+" : count.toString();
    this.$badge.classList.toggle("active", count > 0);
  }

  generateShortcutText(): string {
    // Only provide shortcuts for server [0..9]
    if (this.properties.index >= 9) {
      return "";
    }

    const shownIndex = this.properties.index + 1;

    // Array index == Shown index - 1
    ipcRenderer.send("switch-server-tab", shownIndex - 1);

    return process.platform === "darwin"
      ? `⌘${shownIndex}`
      : `Ctrl+${shownIndex}`;
  }
}
