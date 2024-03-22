import process from "node:process";

import {type Html, html} from "../../../common/html.js";
import {ipcRenderer} from "../typed-ipc-renderer.js";

import {generateNodeFromHtml} from "./base.js";
import Tab, {type TabProps} from "./tab.js";
import type WebView from "./webview.js";

export type ServerTabProps = {
  webview: Promise<WebView>;
} & TabProps;

export default class ServerTab extends Tab {
  webview: Promise<WebView>;
  $el: Element;
  $name: Element;
  $icon: HTMLImageElement;
  $badge: Element;

  constructor({webview, ...props}: ServerTabProps) {
    super(props);

    this.webview = webview;
    this.$el = generateNodeFromHtml(this.templateHtml());
    this.props.$root.append(this.$el);
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
      <div class="tab" data-tab-id="${this.props.tabIndex}">
        <div class="server-tooltip" style="display:none">
          ${this.props.name}
        </div>
        <div class="server-tab-badge"></div>
        <div class="server-tab">
          <img class="server-icons" src="${this.props.icon}" />
        </div>
        <div class="server-tab-shortcut">${this.generateShortcutText()}</div>
      </div>
    `;
  }

  setName(name: string): void {
    this.props.name = name;
    this.$name.textContent = name;
  }

  setIcon(icon: string): void {
    this.props.icon = icon;
    this.$icon.src = icon;
  }

  updateBadge(count: number): void {
    this.$badge.textContent = count > 999 ? "1K+" : count.toString();
    this.$badge.classList.toggle("active", count > 0);
  }

  generateShortcutText(): string {
    // Only provide shortcuts for server [0..9]
    if (this.props.index >= 9) {
      return "";
    }

    const shownIndex = this.props.index + 1;

    // Array index == Shown index - 1
    ipcRenderer.send("switch-server-tab", shownIndex - 1);

    return process.platform === "darwin"
      ? `⌘${shownIndex}`
      : `Ctrl+${shownIndex}`;
  }
}
