import process from "node:process";

import {type Html, html} from "../../../common/html.ts";
import {ipcRenderer} from "../typed-ipc-renderer.ts";

import {generateNodeFromHtml} from "./base.ts";
import Tab, {type TabProperties} from "./tab.ts";
import type WebView from "./webview.ts";

export type ServerTabProperties = {
  webview: Promise<WebView>;
  serverId: string;
} & TabProperties;

export default class ServerTab extends Tab {
  webview: Promise<WebView>;
  serverId: string;
  $el: Element;
  $name: Element;
  $icon: HTMLImageElement;
  $badge: Element;

  constructor({webview, serverId, ...properties}: ServerTabProperties) {
    super(properties);

    this.webview = webview;
    this.serverId = serverId;
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
      <div class="tab" data-tab-id="${this.properties.tabId}">
        <div class="server-tooltip" style="display:none">
          ${this.properties.label}
        </div>
        <div class="server-tab-badge"></div>
        <div class="server-tab">
          <img class="server-icons" src="${this.properties.icon}" />
        </div>
        <div class="server-tab-shortcut">${this.generateShortcutText()}</div>
      </div>
    `;
  }

  setLabel(label: string): void {
    this.properties.label = label;
    this.$name.textContent = label;
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
    ipcRenderer.send("switch-server-tab", this.serverId);

    return process.platform === "darwin"
      ? `⌘${shownIndex}`
      : `Ctrl+${shownIndex}`;
  }
}
