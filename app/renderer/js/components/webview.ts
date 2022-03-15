import type {WebContents} from "electron/main";
import fs from "fs";
import path from "path";

import * as remote from "@electron/remote";
import {app, dialog} from "@electron/remote";

import * as ConfigUtil from "../../../common/config-util";
import type {Html} from "../../../common/html";
import {html} from "../../../common/html";
import type {RendererMessage} from "../../../common/typed-ipc";
import type {TabRole} from "../../../common/types";
import {ipcRenderer} from "../typed-ipc-renderer";
import * as SystemUtil from "../utils/system-util";

import {generateNodeFromHtml} from "./base";
import {contextMenu} from "./context-menu";
import handleExternalLink from "./handle-external-link";

const shouldSilentWebview = ConfigUtil.getConfigItem("silent", false);

interface WebViewProps {
  $root: Element;
  rootWebContents: WebContents;
  index: number;
  tabIndex: number;
  url: string;
  role: TabRole;
  isActive: () => boolean;
  switchLoading: (loading: boolean, url: string) => void;
  onNetworkError: (index: number) => void;
  preload?: string;
  onTitleChange: () => void;
  hasPermission?: (origin: string, permission: string) => boolean;
}

export default class WebView {
  props: WebViewProps;
  zoomFactor: number;
  badgeCount: number;
  loading: boolean;
  customCss: string | false | null;
  $webviewsContainer: DOMTokenList;
  $el: HTMLElement;
  webContentsId: number;

  private constructor(
    props: WebViewProps,
    $element: HTMLElement,
    webContentsId: number,
  ) {
    this.props = props;
    this.zoomFactor = 1;
    this.loading = true;
    this.badgeCount = 0;
    this.customCss = ConfigUtil.getConfigItem("customCSS", null);
    this.$webviewsContainer = document.querySelector(
      "#webviews-container",
    )!.classList;
    this.$el = $element;
    this.webContentsId = webContentsId;

    this.registerListeners();
  }

  static templateHtml(props: WebViewProps): Html {
    return html`
      <webview
        data-tab-id="${props.tabIndex}"
        src="${props.url}"
        ${props.preload === undefined
          ? html``
          : html`preload="${props.preload}"`}
        partition="persist:webviewsession"
        allowpopups
      >
      </webview>
    `;
  }

  static async create(props: WebViewProps): Promise<WebView> {
    const $element = generateNodeFromHtml(
      WebView.templateHtml(props),
    ) as HTMLElement;
    props.$root.append($element);

    // Wait for did-navigate rather than did-attach to work around
    // https://github.com/electron/electron/issues/31918
    await new Promise<void>((resolve) => {
      $element.addEventListener(
        "did-navigate",
        () => {
          resolve();
        },
        true,
      );
    });

    // Work around https://github.com/electron/electron/issues/26904
    function getWebContentsIdFunction(
      this: undefined,
      selector: string,
    ): number {
      return document
        .querySelector<Electron.WebviewTag>(selector)!
        .getWebContentsId();
    }

    const selector = `webview[data-tab-id="${CSS.escape(
      `${props.tabIndex}`,
    )}"]`;
    const webContentsId: unknown =
      await props.rootWebContents.executeJavaScript(
        `(${getWebContentsIdFunction.toString()})(${JSON.stringify(selector)})`,
      );
    if (typeof webContentsId !== "number") {
      throw new TypeError("Failed to get WebContents ID");
    }

    return new WebView(props, $element, webContentsId);
  }

  getWebContents(): WebContents {
    return remote.webContents.fromId(this.webContentsId);
  }

  registerListeners(): void {
    const webContents = this.getWebContents();

    webContents.setWindowOpenHandler((details) => {
      handleExternalLink.call(this, details);
      return {action: "deny"};
    });

    if (shouldSilentWebview) {
      webContents.setAudioMuted(true);
    }

    webContents.on("page-title-updated", (_event, title) => {
      this.badgeCount = this.getBadgeCount(title);
      this.props.onTitleChange();
    });

    this.$el.addEventListener("did-navigate-in-page", () => {
      this.canGoBackButton();
    });

    this.$el.addEventListener("did-navigate", () => {
      this.canGoBackButton();
    });

    webContents.on("page-favicon-updated", (_event, favicons) => {
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

    webContents.addListener("context-menu", (event, menuParameters) => {
      contextMenu(webContents, event, menuParameters);
    });

    this.$el.addEventListener("dom-ready", () => {
      this.loading = false;
      this.props.switchLoading(false, this.props.url);
      this.show();
    });

    webContents.on("did-fail-load", (_event, _errorCode, errorDescription) => {
      const hasConnectivityError =
        SystemUtil.connectivityError.includes(errorDescription);
      if (hasConnectivityError) {
        console.error("error", errorDescription);
        if (!this.props.url.includes("network.html")) {
          this.props.onNetworkError(this.props.index);
        }
      }
    });

    this.$el.addEventListener("did-start-loading", () => {
      this.props.switchLoading(true, this.props.url);
    });

    this.$el.addEventListener("did-stop-loading", () => {
      this.props.switchLoading(false, this.props.url);
    });
  }

  getBadgeCount(title: string): number {
    const messageCountInTitle = /^\((\d+)\)/.exec(title);
    return messageCountInTitle ? Number(messageCountInTitle[1]) : 0;
  }

  showNotificationSettings(): void {
    this.send("show-notification-settings");
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

    this.$el.classList.add("active");
    this.focus();
    this.props.onTitleChange();
    // Injecting preload css in webview to override some css rules
    (async () =>
      this.getWebContents().insertCSS(
        fs.readFileSync(path.join(__dirname, "/../../css/preload.css"), "utf8"),
      ))();

    // Get customCSS again from config util to avoid warning user again
    const customCss = ConfigUtil.getConfigItem("customCSS", null);
    this.customCss = customCss;
    if (customCss) {
      if (!fs.existsSync(customCss)) {
        this.customCss = null;
        ConfigUtil.setConfigItem("customCSS", null);

        const errorMessage = "The custom css previously set is deleted!";
        dialog.showErrorBox("custom css file deleted!", errorMessage);
        return;
      }

      (async () =>
        this.getWebContents().insertCSS(
          fs.readFileSync(path.resolve(__dirname, customCss), "utf8"),
        ))();
    }
  }

  focus(): void {
    this.$el.focus();
    // Work around https://github.com/electron/electron/issues/31918
    this.$el.shadowRoot?.querySelector("iframe")?.focus();
  }

  hide(): void {
    this.$el.classList.remove("active");
  }

  load(): void {
    this.show();
  }

  zoomIn(): void {
    this.zoomFactor += 0.1;
    this.getWebContents().setZoomFactor(this.zoomFactor);
  }

  zoomOut(): void {
    this.zoomFactor -= 0.1;
    this.getWebContents().setZoomFactor(this.zoomFactor);
  }

  zoomActualSize(): void {
    this.zoomFactor = 1;
    this.getWebContents().setZoomFactor(this.zoomFactor);
  }

  logOut(): void {
    this.send("logout");
  }

  showKeyboardShortcuts(): void {
    this.send("show-keyboard-shortcuts");
  }

  openDevTools(): void {
    this.getWebContents().openDevTools();
  }

  back(): void {
    if (this.getWebContents().canGoBack()) {
      this.getWebContents().goBack();
      this.focus();
    }
  }

  canGoBackButton(): void {
    const $backButton = document.querySelector(
      "#actions-container #back-action",
    )!;
    if (this.getWebContents().canGoBack()) {
      $backButton.classList.remove("disable");
    } else {
      $backButton.classList.add("disable");
    }
  }

  forward(): void {
    if (this.getWebContents().canGoForward()) {
      this.getWebContents().goForward();
    }
  }

  reload(): void {
    this.hide();
    // Shows the loading indicator till the webview is reloaded
    this.$webviewsContainer.remove("loaded");
    this.loading = true;
    this.props.switchLoading(true, this.props.url);
    this.getWebContents().reload();
  }

  send<Channel extends keyof RendererMessage>(
    channel: Channel,
    ...args: Parameters<RendererMessage[Channel]>
  ): void {
    ipcRenderer.sendTo(this.webContentsId, channel, ...args);
  }
}
