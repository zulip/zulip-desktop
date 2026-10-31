import process from "node:process";

import {type Html, html} from "../../../common/html.ts";
import defaultIcon from "../../img/icon.png";
import {ipcRenderer} from "../typed-ipc-renderer.ts";

import {generateNodeFromHtml} from "./base.ts";
import Tab, {type TabProperties} from "./tab.ts";
import type WebView from "./webview.ts";

export type ServerTabProperties = {
  webview: Promise<WebView>;
} & TabProperties;

export default class ServerTab extends Tab {
  webview: Promise<WebView>;
  $el: Element;
  $name: Element;
  $icon: HTMLImageElement;
  $altIcon: HTMLElement;
  $badge: Element;

  constructor({webview, ...properties}: ServerTabProperties) {
    super(properties);

    this.webview = webview;
    this.$el = generateNodeFromHtml(this.templateHtml());
    this.properties.$root.append(this.$el);
    this.registerListeners();
    this.$name = this.$el.querySelector(".server-tooltip")!;
    this.$icon = this.$el.querySelector(".server-icons")!;
    this.$altIcon = this.$el.querySelector(".alt-icon")!;
    this.$badge = this.$el.querySelector(".server-tab-badge")!;

    this.initIcon();
  }

  override registerListeners(): void {
    super.registerListeners();

    this.$icon.addEventListener("load", () => {
      if (!this.isDefaultIcon(this.properties.icon)) {
        this.$icon.style.display = "";
        this.$altIcon.style.display = "none";
      }
    });

    this.$icon.addEventListener("error", () => {
      this.$icon.style.display = "none";
      this.$altIcon.style.display = "";
    });
  }

  isDefaultIcon(icon?: string): boolean {
    return (
      icon === undefined ||
      icon === "" ||
      icon === defaultIcon ||
      icon.endsWith("icon.png") ||
      icon.endsWith("../renderer/img/icon.png")
    );
  }

  getCharLogo(): string {
    const label = this.properties.label.trim();
    return label === "" ? "Z" : label.charAt(0).toUpperCase();
  }

  initIcon(): void {
    if (
      !this.isDefaultIcon(this.properties.icon) &&
      this.$icon.complete &&
      this.$icon.naturalWidth > 0
    ) {
      this.$icon.style.display = "";
      this.$altIcon.style.display = "none";
    }
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
          <div class="server-icon alt-icon">${this.getCharLogo()}</div>
          <img
            class="server-icons"
            src="${this.properties.icon}"
            style="display:none"
          />
        </div>
        <div class="server-tab-shortcut">${this.generateShortcutText()}</div>
      </div>
    `;
  }

  setLabel(label: string): void {
    this.properties.label = label;
    this.$name.textContent = label;
    this.$altIcon.textContent = this.getCharLogo();
  }

  setIcon(icon: string): void {
    this.properties.icon = icon;
    if (this.isDefaultIcon(icon)) {
      this.$icon.style.display = "none";
      this.$altIcon.style.display = "";
    } else {
      this.$icon.style.display = "none";
      this.$altIcon.style.display = "";
      this.$icon.src = icon;
    }
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
