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
  $name: HTMLElement;
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

    // Ensuring tooltip is initially hidden
    this.$name.style.display = "none";

    // Hover event listeners
    this.$el.addEventListener("mouseover", () => {
      this.$name.removeAttribute("style");
      const {top} = this.$el.getBoundingClientRect();
      this.$name.style.top = `${top}px`;
    });
    
    this.$el.addEventListener("mouseout", () => {
      this.$name.style.display = "none";
    });
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
    ipcRenderer.send("switch-server-tab", shownIndex - 1);

    return process.platform === "darwin"
      ? `⌘${shownIndex}`
      : `Ctrl+${shownIndex}`;
  }
}
