import type {HTML} from "../../../common/html";
import {html} from "../../../common/html";
import {ipcRenderer} from "../typed-ipc-renderer";

import {generateNodeFromHTML} from "./base";
import type {TabProps} from "./tab";
import Tab from "./tab";
import type WebView from "./webview";

export interface ServerTabProps extends TabProps {
  webview: WebView;
}

export default class ServerTab extends Tab {
  webview: WebView;
  $el: Element;
  $badge: Element;

  constructor({webview, ...props}: ServerTabProps) {
    super(props);

    this.webview = webview;
    this.$el = generateNodeFromHTML(this.templateHTML());
    this.props.$root.append(this.$el);
    this.registerListeners();
    this.$badge = this.$el.querySelector(".server-tab-badge")!;
  }

  override activate(): void {
    super.activate();
    this.webview.load();
  }

  override deactivate(): void {
    super.deactivate();
    this.webview.hide();
  }

  override destroy(): void {
    super.destroy();
    this.webview.$el!.remove();
  }

  templateHTML(): HTML {
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

  updateBadge(count: number): void {
    if (count > 0) {
      const formattedCount = count > 999 ? "1K+" : count.toString();
      this.$badge.textContent = formattedCount;
      this.$badge.classList.add("active");
    } else {
      this.$badge.classList.remove("active");
    }
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
