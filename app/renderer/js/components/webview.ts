import fs from "fs";
import path from "path";

import * as remote from "@electron/remote";
import {app, dialog} from "@electron/remote";

import * as ConfigUtil from "../../../common/config-util";
import {HTML, html} from "../../../common/html";
import type {RendererMessage} from "../../../common/typed-ipc";
import type {TabRole} from "../../../common/types";
import {ipcRenderer} from "../typed-ipc-renderer";
import * as SystemUtil from "../utils/system-util";

import {generateNodeFromHTML} from "./base";
import {contextMenu} from "./context-menu";
import handleExternalLink from "./handle-external-link";

const shouldSilentWebview = ConfigUtil.getConfigItem("silent", false);

interface WebViewProps {
  $root: Element;
  index: number;
  tabIndex: number;
  url: string;
  role: TabRole;
  isActive: () => boolean;
  switchLoading: (loading: boolean, url: string) => void;
  onNetworkError: (index: number) => void;
  nodeIntegration: boolean;
  preload: boolean;
  onTitleChange: () => void;
  hasPermission?: (origin: string, permission: string) => boolean;
}

export default class WebView {
  props: WebViewProps;
  zoomFactor: number;
  badgeCount: number;
  loading: boolean;
  customCSS: string | false | null;
  $webviewsContainer: DOMTokenList;
  $el?: Electron.WebviewTag;
  whenAttached?: Promise<void>;

  constructor(props: WebViewProps) {
    this.props = props;
    this.zoomFactor = 1;
    this.loading = true;
    this.badgeCount = 0;
    this.customCSS = ConfigUtil.getConfigItem("customCSS", null);
    this.$webviewsContainer = document.querySelector(
      "#webviews-container",
    )!.classList;
  }

  templateHTML(): HTML {
    return html`
      <webview
        class="disabled"
        data-tab-id="${this.props.tabIndex}"
        src="${this.props.url}"
        ${new HTML({html: this.props.nodeIntegration ? "nodeIntegration" : ""})}
        ${new HTML({html: this.props.preload ? 'preload="js/preload.js"' : ""})}
        partition="persist:webviewsession"
        webpreferences="
          contextIsolation=${!this.props.nodeIntegration},
          spellcheck=${Boolean(
          ConfigUtil.getConfigItem("enableSpellchecker", true),
        )},
          worldSafeExecuteJavaScript=true
        "
      >
      </webview>
    `;
  }

  init(): void {
    this.$el = generateNodeFromHTML(this.templateHTML()) as Electron.WebviewTag;
    this.whenAttached = new Promise((resolve) => {
      this.$el!.addEventListener(
        "did-attach",
        () => {
          resolve();
        },
        true,
      );
    });
    this.props.$root.append(this.$el);

    this.registerListeners();
  }

  registerListeners(): void {
    this.$el!.addEventListener("new-window", (event) => {
      handleExternalLink.call(this, event);
    });

    if (shouldSilentWebview) {
      this.$el!.addEventListener("did-attach", () => {
        this.$el!.setAudioMuted(true);
      });
    }

    this.$el!.addEventListener("page-title-updated", (event) => {
      const {title} = event;
      this.badgeCount = this.getBadgeCount(title);
      this.props.onTitleChange();
    });

    this.$el!.addEventListener("did-navigate-in-page", () => {
      this.canGoBackButton();
    });

    this.$el!.addEventListener("did-navigate", () => {
      this.canGoBackButton();
    });

    this.$el!.addEventListener("page-favicon-updated", (event) => {
      const {favicons} = event;

      // This returns a string of favicons URL. If there is a PM counts in unread messages then the URL would be like
      // https://chat.zulip.org/static/images/favicon/favicon-pms.png
      if (
        favicons[0].indexOf("favicon-pms") > 0 &&
        process.platform === "darwin"
      ) {
        // This api is only supported on macOS
        app.dock.setBadge("●");
        // Bounce the dock
        if (ConfigUtil.getConfigItem("dockBouncing", true)) {
          app.dock.bounce();
        }
      }
    });

    this.$el!.addEventListener("did-attach", () => {
      const webContents = remote.webContents.fromId(
        this.$el!.getWebContentsId(),
      );
      webContents.addListener("context-menu", (event, menuParameters) => {
        contextMenu(webContents, event, menuParameters);
      });
    });

    this.$el!.addEventListener("dom-ready", () => {
      if (this.props.role === "server") {
        this.$el!.classList.add("onload");
      }

      this.loading = false;
      this.props.switchLoading(false, this.props.url);
      this.show();
    });

    this.$el!.addEventListener("did-fail-load", (event) => {
      const {errorDescription} = event;
      const hasConnectivityError =
        SystemUtil.connectivityERR.includes(errorDescription);
      if (hasConnectivityError) {
        console.error("error", errorDescription);
        if (!this.props.url.includes("network.html")) {
          this.props.onNetworkError(this.props.index);
        }
      }
    });

    this.$el!.addEventListener("did-start-loading", () => {
      this.props.switchLoading(true, this.props.url);
    });

    this.$el!.addEventListener("did-stop-loading", () => {
      this.props.switchLoading(false, this.props.url);
    });
  }

  getBadgeCount(title: string): number {
    const messageCountInTitle = /^\((\d+)\)/.exec(title);
    return messageCountInTitle ? Number(messageCountInTitle[1]) : 0;
  }

  async showNotificationSettings(): Promise<void> {
    await this.send("show-notification-settings");
  }

  show(): void {
    // Do not show WebView if another tab was selected and this tab should be in background.
    if (!this.props.isActive()) {
      return;
    }

    // To show or hide the loading indicator in the the active tab
    if (this.loading) {
      this.$webviewsContainer.remove("loaded");
    } else {
      this.$webviewsContainer.add("loaded");
    }

    this.$el!.classList.remove("disabled");
    this.$el!.classList.add("active");
    setTimeout(() => {
      if (this.props.role === "server") {
        this.$el!.classList.remove("onload");
      }
    }, 1000);
    this.focus();
    this.props.onTitleChange();
    // Injecting preload css in webview to override some css rules
    (async () =>
      this.$el!.insertCSS(
        fs.readFileSync(path.join(__dirname, "/../../css/preload.css"), "utf8"),
      ))();

    // Get customCSS again from config util to avoid warning user again
    const customCSS = ConfigUtil.getConfigItem("customCSS", null);
    this.customCSS = customCSS;
    if (customCSS) {
      if (!fs.existsSync(customCSS)) {
        this.customCSS = null;
        ConfigUtil.setConfigItem("customCSS", null);

        const errorMessage = "The custom css previously set is deleted!";
        dialog.showErrorBox("custom css file deleted!", errorMessage);
        return;
      }

      (async () =>
        this.$el!.insertCSS(
          fs.readFileSync(path.resolve(__dirname, customCSS), "utf8"),
        ))();
    }
  }

  focus(): void {
    // Focus Webview and it's contents when Window regain focus.
    const webContents = remote.webContents.fromId(this.$el!.getWebContentsId());
    // HACK: webContents.isFocused() seems to be true even without the element
    // being in focus. So, we check against `document.activeElement`.
    if (webContents && this.$el !== document.activeElement) {
      // HACK: Looks like blur needs to be called on the previously focused
      // element to transfer focus correctly, in Electron v3.0.10
      // See https://github.com/electron/electron/issues/15718
      (document.activeElement as HTMLElement).blur();
      this.$el!.focus();
      webContents.focus();
    }
  }

  hide(): void {
    this.$el!.classList.add("disabled");
    this.$el!.classList.remove("active");
  }

  load(): void {
    if (this.$el) {
      this.show();
    } else {
      this.init();
    }
  }

  zoomIn(): void {
    this.zoomFactor += 0.1;
    this.$el!.setZoomFactor(this.zoomFactor);
  }

  zoomOut(): void {
    this.zoomFactor -= 0.1;
    this.$el!.setZoomFactor(this.zoomFactor);
  }

  zoomActualSize(): void {
    this.zoomFactor = 1;
    this.$el!.setZoomFactor(this.zoomFactor);
  }

  async logOut(): Promise<void> {
    await this.send("logout");
  }

  async showKeyboardShortcuts(): Promise<void> {
    await this.send("show-keyboard-shortcuts");
  }

  openDevTools(): void {
    this.$el!.openDevTools();
  }

  back(): void {
    if (this.$el!.canGoBack()) {
      this.$el!.goBack();
      this.focus();
    }
  }

  canGoBackButton(): void {
    const $backButton = document.querySelector(
      "#actions-container #back-action",
    )!;
    if (this.$el!.canGoBack()) {
      $backButton.classList.remove("disable");
    } else {
      $backButton.classList.add("disable");
    }
  }

  forward(): void {
    if (this.$el!.canGoForward()) {
      this.$el!.goForward();
    }
  }

  reload(): void {
    this.hide();
    // Shows the loading indicator till the webview is reloaded
    this.$webviewsContainer.remove("loaded");
    this.loading = true;
    this.props.switchLoading(true, this.props.url);
    this.$el!.reload();
  }

  async send<Channel extends keyof RendererMessage>(
    channel: Channel,
    ...args: Parameters<RendererMessage[Channel]>
  ): Promise<void> {
    await this.whenAttached;
    ipcRenderer.sendTo(this.$el!.getWebContentsId(), channel, ...args);
  }
}
