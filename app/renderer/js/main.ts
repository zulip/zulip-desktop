import {clipboard} from "electron/common";
import path from "node:path";
import process from "node:process";
import url from "node:url";

import {Menu, app, dialog, session} from "@electron/remote";
import * as remote from "@electron/remote";
import * as Sentry from "@sentry/electron/renderer";

import type {Config} from "../../common/config-util.js";
import * as ConfigUtil from "../../common/config-util.js";
import * as DNDUtil from "../../common/dnd-util.js";
import type {DndSettings} from "../../common/dnd-util.js";
import * as EnterpriseUtil from "../../common/enterprise-util.js";
import * as LinkUtil from "../../common/link-util.js";
import Logger from "../../common/logger-util.js";
import * as Messages from "../../common/messages.js";
import {bundlePath, bundleUrl} from "../../common/paths.js";
import type {
  NavigationItem,
  ServerConfig,
  TabData,
} from "../../common/types.js";
import defaultIcon from "../img/icon.png";

import FunctionalTab from "./components/functional-tab.js";
import ServerTab from "./components/server-tab.js";
import WebView from "./components/webview.js";
import {AboutView} from "./pages/about.js";
import {PreferenceView} from "./pages/preference/preference.js";
import {initializeTray} from "./tray.js";
import {ipcRenderer} from "./typed-ipc-renderer.js";
import * as DomainUtil from "./utils/domain-util.js";
import ReconnectUtil from "./utils/reconnect-util.js";

Sentry.init({});

type WebviewListener =
  | "webview-reload"
  | "back"
  | "focus"
  | "forward"
  | "zoomIn"
  | "zoomOut"
  | "zoomActualSize"
  | "log-out"
  | "show-keyboard-shortcuts"
  | "tab-devtools";

const logger = new Logger({
  file: "errors.log",
});

type ServerOrFunctionalTab = ServerTab | FunctionalTab;

const rootWebContents = remote.getCurrentWebContents();

const dingSound = new Audio(
  new URL("resources/sounds/ding.ogg", bundleUrl).href,
);

export class ServerManagerView {
  $addServerButton: HTMLButtonElement;
  $tabsContainer: Element;
  $reloadButton: HTMLButtonElement;
  $loadingIndicator: HTMLButtonElement;
  $settingsButton: HTMLButtonElement;
  $webviewsContainer: Element;
  $backButton: HTMLButtonElement;
  $dndButton: HTMLButtonElement;
  $addServerTooltip: HTMLElement;
  $reloadTooltip: HTMLElement;
  $loadingTooltip: HTMLElement;
  $settingsTooltip: HTMLElement;
  $serverIconTooltip: HTMLCollectionOf<HTMLElement>;
  $backTooltip: HTMLElement;
  $dndTooltip: HTMLElement;
  $sidebar: Element;
  $fullscreenPopup: Element;
  $fullscreenEscapeKey: string;
  loading: Set<string>;
  activeTabIndex: number;
  tabs: ServerOrFunctionalTab[];
  functionalTabs: Map<string, number>;
  tabIndex: number;
  presetOrgs: string[];
  preferenceView?: PreferenceView;
  constructor() {
    this.$addServerButton = document.querySelector("#add-tab")!;
    this.$tabsContainer = document.querySelector("#tabs-container")!;

    const $actionsContainer = document.querySelector("#actions-container")!;
    this.$reloadButton = $actionsContainer.querySelector("#reload-action")!;
    this.$loadingIndicator =
      $actionsContainer.querySelector("#loading-action")!;
    this.$settingsButton = $actionsContainer.querySelector("#settings-action")!;
    this.$webviewsContainer = document.querySelector("#webviews-container")!;
    this.$backButton = $actionsContainer.querySelector("#back-action")!;
    this.$dndButton = $actionsContainer.querySelector("#dnd-action")!;

    this.$addServerTooltip = document.querySelector("#add-server-tooltip")!;
    this.$reloadTooltip = $actionsContainer.querySelector("#reload-tooltip")!;
    this.$loadingTooltip = $actionsContainer.querySelector("#loading-tooltip")!;
    this.$settingsTooltip =
      $actionsContainer.querySelector("#setting-tooltip")!;

    // TODO: This should have been querySelector but the problem is that
    // querySelector doesn't return elements not present in dom whereas somehow
    // getElementsByClassName does. To fix this we need to call this after this.initTabs
    // is called in this.init.
    // eslint-disable-next-line unicorn/prefer-query-selector
    this.$serverIconTooltip = document.getElementsByClassName(
      "server-tooltip",
    ) as HTMLCollectionOf<HTMLElement>;
    this.$backTooltip = $actionsContainer.querySelector("#back-tooltip")!;
    this.$dndTooltip = $actionsContainer.querySelector("#dnd-tooltip")!;

    this.$sidebar = document.querySelector("#sidebar")!;

    this.$fullscreenPopup = document.querySelector("#fullscreen-popup")!;
    this.$fullscreenEscapeKey = process.platform === "darwin" ? "^⌘F" : "F11";
    this.$fullscreenPopup.textContent = `Press ${this.$fullscreenEscapeKey} to exit full screen`;

    this.loading = new Set();
    this.activeTabIndex = -1;
    this.tabs = [];
    this.presetOrgs = [];
    this.functionalTabs = new Map();
    this.tabIndex = 0;
  }

  async init(): Promise<void> {
    initializeTray(this);
    await this.loadProxy();
    this.initDefaultSettings();
    this.initSidebar();
    this.removeUaFromDisk();
    if (EnterpriseUtil.hasConfigFile()) {
      await this.initPresetOrgs();
    }

    await this.initTabs();
    this.initActions();
    this.registerIpcs();
  }

  async loadProxy(): Promise<void> {
    // To change proxyEnable to useManualProxy in older versions
    const proxyEnabledOld = ConfigUtil.isConfigItemExists("useProxy");
    if (proxyEnabledOld) {
      const proxyEnableOldState = ConfigUtil.getConfigItem("useProxy", false);
      if (proxyEnableOldState) {
        ConfigUtil.setConfigItem("useManualProxy", true);
      }

      ConfigUtil.removeConfigItem("useProxy");
    }

    await session.fromPartition("persist:webviewsession").setProxy(
      ConfigUtil.getConfigItem("useSystemProxy", false)
        ? {mode: "system"}
        : ConfigUtil.getConfigItem("useManualProxy", false)
          ? {
              pacScript: ConfigUtil.getConfigItem("proxyPAC", ""),
              proxyRules: ConfigUtil.getConfigItem("proxyRules", ""),
              proxyBypassRules: ConfigUtil.getConfigItem("proxyBypass", ""),
            }
          : {mode: "direct"},
    );
  }

  // Settings are initialized only when user clicks on General/Server/Network section settings
  // In case, user doesn't visit these section, those values set to be null automatically
  // This will make sure the default settings are correctly set to either true or false
  initDefaultSettings(): void {
    // Default settings which should be respected
    const settingOptions: Partial<Config> = {
      autoHideMenubar: false,
      trayIcon: true,
      useManualProxy: false,
      useSystemProxy: false,
      showSidebar: true,
      badgeOption: true,
      startAtLogin: false,
      startMinimized: false,
      enableSpellchecker: true,
      showNotification: true,
      autoUpdate: true,
      betaUpdate: false,
      errorReporting: true,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      customCSS: false,
      silent: false,
      lastActiveTab: 0,
      dnd: false,
      dndPreviousSettings: {
        showNotification: true,
        silent: false,
      },
      downloadsPath: `${app.getPath("downloads")}`,
      quitOnClose: false,
      promptDownload: false,
    };

    // Platform specific settings

    if (process.platform === "win32") {
      // Only available on Windows
      settingOptions.flashTaskbarOnMessage = true;
      settingOptions.dndPreviousSettings!.flashTaskbarOnMessage = true;
    }

    if (process.platform === "darwin") {
      // Only available on macOS
      settingOptions.dockBouncing = true;
    }

    if (process.platform !== "darwin") {
      settingOptions.autoHideMenubar = false;
      settingOptions.spellcheckerLanguages = ["en-US"];
    }

    for (const [setting, value] of Object.entries(settingOptions) as Array<
      {[Key in keyof Config]: [Key, Config[Key]]}[keyof Config]
    >) {
      // Give preference to defaults defined in global_config.json
      if (EnterpriseUtil.configItemExists(setting)) {
        ConfigUtil.setConfigItem(
          setting,
          EnterpriseUtil.getConfigItem(setting, value),
          true,
        );
      } else if (!ConfigUtil.isConfigItemExists(setting)) {
        ConfigUtil.setConfigItem(setting, value);
      }
    }
  }

  initSidebar(): void {
    const showSidebar = ConfigUtil.getConfigItem("showSidebar", true);
    this.toggleSidebar(showSidebar);
  }

  // Remove the stale UA string from the disk if the app is not freshly
  // installed.  This should be removed in a further release.
  removeUaFromDisk(): void {
    ConfigUtil.removeConfigItem("userAgent");
  }

  async queueDomain(domain: string): Promise<boolean> {
    // Allows us to start adding multiple domains to the app simultaneously
    // promise of addition resolves in both cases, but we consider it rejected
    // if the resolved value is false
    try {
      const serverConfig = await DomainUtil.checkDomain(domain);
      await DomainUtil.addDomain(serverConfig);
      return true;
    } catch (error: unknown) {
      logger.error(error);
      logger.error(
        `Could not add ${domain}. Please contact your system administrator.`,
      );
      return false;
    }
  }

  async initPresetOrgs(): Promise<void> {
    // Read preset organizations from global_config.json and queues them
    // for addition to the app's domains
    const preAddedDomains = DomainUtil.getDomains();
    this.presetOrgs = EnterpriseUtil.getConfigItem("presetOrganizations", []);
    // Set to true if at least one new domain is added
    const domainPromises = [];
    for (const url of this.presetOrgs) {
      if (DomainUtil.duplicateDomain(url)) {
        continue;
      }

      domainPromises.push(this.queueDomain(url));
    }

    const domainsAdded = await Promise.all(domainPromises);
    if (domainsAdded.includes(true)) {
      // At least one domain was resolved
      if (preAddedDomains.length > 0) {
        // User already has servers added
        // ask them before reloading the app
        const {response} = await dialog.showMessageBox({
          type: "question",
          buttons: ["Yes", "Later"],
          defaultId: 0,
          message:
            "New server" +
            (domainsAdded.length > 1 ? "s" : "") +
            " added. Reload app now?",
        });
        if (response === 0) {
          ipcRenderer.send("reload-full-app");
        }
      } else {
        ipcRenderer.send("reload-full-app");
      }
    } else if (domainsAdded.length > 0) {
      // Find all orgs that failed
      const failedDomains: string[] = [];
      for (const org of this.presetOrgs) {
        if (DomainUtil.duplicateDomain(org)) {
          continue;
        }

        failedDomains.push(org);
      }

      const {title, content} = Messages.enterpriseOrgError(
        domainsAdded.length,
        failedDomains,
      );
      dialog.showErrorBox(title, content);
      if (DomainUtil.getDomains().length === 0) {
        // No orgs present, stop showing loading gif
        await this.openSettings("AddServer");
      }
    }
  }

  async initTabs(): Promise<void> {
    const servers = DomainUtil.getDomains();
    if (servers.length > 0) {
      for (const [i, server] of servers.entries()) {
        const tab = this.initServer(server, i);
        (async () => {
          const serverConfig = await DomainUtil.updateSavedServer(
            server.url,
            i,
          );
          tab.setName(serverConfig.alias);
          tab.setIcon(DomainUtil.iconAsUrl(serverConfig.icon));
          (await tab.webview).setUnsupportedMessage(
            DomainUtil.getUnsupportedMessage(serverConfig),
          );
        })();
      }

      // Open last active tab
      let lastActiveTab = ConfigUtil.getConfigItem("lastActiveTab", 0);
      if (lastActiveTab >= servers.length) {
        lastActiveTab = 0;
      }

      // `webview.load()` for lastActiveTab before the others
      await this.activateTab(lastActiveTab);
      await Promise.all(
        servers.map(async (server, i) => {
          // After the lastActiveTab is activated, we load the others in the background
          // without activating them, to prevent flashing of server icons
          if (i === lastActiveTab) {
            return;
          }

          const tab = this.tabs[i];
          if (tab instanceof ServerTab) (await tab.webview).load();
        }),
      );
      // Remove focus from the settings icon at sidebar bottom
      this.$settingsButton.classList.remove("active");
    } else if (this.presetOrgs.length === 0) {
      // Not attempting to add organisations in the background
      await this.openSettings("AddServer");
    } else {
      this.showLoading(true);
    }
  }

  initServer(server: ServerConfig, index: number): ServerTab {
    const tabIndex = this.getTabIndex();
    const tab = new ServerTab({
      role: "server",
      icon: DomainUtil.iconAsUrl(server.icon),
      name: server.alias,
      $root: this.$tabsContainer,
      onClick: this.activateLastTab.bind(this, index),
      index,
      tabIndex,
      onHover: this.onHover.bind(this, index),
      onHoverOut: this.onHoverOut.bind(this, index),
      webview: WebView.create({
        $root: this.$webviewsContainer,
        rootWebContents,
        index,
        tabIndex,
        url: server.url,
        role: "server",
        hasPermission: (origin: string, permission: string) =>
          origin === server.url &&
          permission === "notifications" &&
          ConfigUtil.getConfigItem("showNotification", true),
        isActive: () => index === this.activeTabIndex,
        switchLoading: async (loading: boolean, url: string) => {
          if (loading) {
            this.loading.add(url);
          } else {
            this.loading.delete(url);
          }

          const tab = this.tabs[this.activeTabIndex];
          this.showLoading(
            tab instanceof ServerTab &&
              this.loading.has((await tab.webview).properties.url),
          );
        },
        onNetworkError: async (index: number) => {
          await this.openNetworkTroubleshooting(index);
        },
        onTitleChange: this.updateBadge.bind(this),
        preload: url.pathToFileURL(path.join(bundlePath, "preload.js")).href,
        unsupportedMessage: DomainUtil.getUnsupportedMessage(server),
      }),
    });
    this.tabs.push(tab);
    this.loading.add(server.url);
    return tab;
  }

  initActions(): void {
    this.initDndButton();
    this.initServerActions();
    this.initLeftSidebarEvents();
  }

  initServerActions(): void {
    const $serverImgs: NodeListOf<HTMLImageElement> =
      document.querySelectorAll(".server-icons");
    for (const [index, $serverImg] of $serverImgs.entries()) {
      this.addContextMenu($serverImg, index);
      if ($serverImg.src === defaultIcon) {
        this.displayInitialCharLogo($serverImg, index);
      }

      $serverImg.addEventListener("error", () => {
        this.displayInitialCharLogo($serverImg, index);
      });
    }
  }

  initLeftSidebarEvents(): void {
    this.$dndButton.addEventListener("click", () => {
      const dndUtil = DNDUtil.toggle();
      ipcRenderer.send(
        "forward-message",
        "toggle-dnd",
        dndUtil.dnd,
        dndUtil.newSettings,
      );
    });
    this.$reloadButton.addEventListener("click", async () => {
      const tab = this.tabs[this.activeTabIndex];
      if (tab instanceof ServerTab) (await tab.webview).reload();
    });
    this.$addServerButton.addEventListener("click", async () => {
      await this.openSettings("AddServer");
    });
    this.$settingsButton.addEventListener("click", async () => {
      await this.openSettings("General");
    });
    this.$backButton.addEventListener("click", async () => {
      const tab = this.tabs[this.activeTabIndex];
      if (tab instanceof ServerTab) (await tab.webview).back();
    });

    this.sidebarHoverEvent(this.$addServerButton, this.$addServerTooltip, true);
    this.sidebarHoverEvent(this.$loadingIndicator, this.$loadingTooltip);
    this.sidebarHoverEvent(this.$settingsButton, this.$settingsTooltip);
    this.sidebarHoverEvent(this.$reloadButton, this.$reloadTooltip);
    this.sidebarHoverEvent(this.$backButton, this.$backTooltip);
    this.sidebarHoverEvent(this.$dndButton, this.$dndTooltip);
  }

  initDndButton(): void {
    const dnd = ConfigUtil.getConfigItem("dnd", false);
    this.toggleDndButton(dnd);
  }

  getTabIndex(): number {
    const currentIndex = this.tabIndex;
    this.tabIndex++;
    return currentIndex;
  }

  async getCurrentActiveServer(): Promise<string> {
    const tab = this.tabs[this.activeTabIndex];
    return tab instanceof ServerTab ? (await tab.webview).properties.url : "";
  }

  displayInitialCharLogo($img: HTMLImageElement, index: number): void {
    // The index parameter is needed because webview[data-tab-id] can
    // increment beyond the size of the sidebar org array and throw an
    // error

    const $altIcon = document.createElement("div");
    const $parent = $img.parentElement!;
    const $container = $parent.parentElement!;
    const webviewId = $container.dataset.tabId!;
    const $webview = document.querySelector(
      `webview[data-tab-id="${CSS.escape(webviewId)}"]`,
    )!;
    const realmName = $webview.getAttribute("name");

    if (realmName === null) {
      $img.src = defaultIcon;
      return;
    }

    $altIcon.textContent = realmName.charAt(0) || "Z";
    $altIcon.classList.add("server-icon");
    $altIcon.classList.add("alt-icon");

    $img.remove();
    $parent.append($altIcon);

    this.addContextMenu($altIcon, index);
  }

  sidebarHoverEvent(
    SidebarButton: HTMLButtonElement,
    SidebarTooltip: HTMLElement,
    addServer = false,
  ): void {
    SidebarButton.addEventListener("mouseover", () => {
      SidebarTooltip.removeAttribute("style");
      // To handle position of add server tooltip due to scrolling of list of organizations
      // This could not be handled using CSS, hence the top of the tooltip is made same
      // as that of its parent element.
      // This needs to handled only for the add server tooltip and not others.
      if (addServer) {
        const {top} = SidebarButton.getBoundingClientRect();
        SidebarTooltip.style.top = `${top}px`;
      }
    });
    SidebarButton.addEventListener("mouseout", () => {
      SidebarTooltip.style.display = "none";
    });
  }

  onHover(index: number): void {
    // `this.$serverIconTooltip[index].textContent` already has realm name, so we are just
    // removing the style.
    this.$serverIconTooltip[index].removeAttribute("style");
    // To handle position of servers' tooltip due to scrolling of list of organizations
    // This could not be handled using CSS, hence the top of the tooltip is made same
    // as that of its parent element.
    const {top} =
      this.$serverIconTooltip[index].parentElement!.getBoundingClientRect();
    this.$serverIconTooltip[index].style.top = `${top}px`;
  }

  onHoverOut(index: number): void {
    this.$serverIconTooltip[index].style.display = "none";
  }

  async openFunctionalTab(tabProperties: {
    name: string;
    materialIcon: string;
    makeView: () => Promise<Element>;
    destroyView: () => void;
  }): Promise<void> {
    if (this.functionalTabs.has(tabProperties.name)) {
      await this.activateTab(this.functionalTabs.get(tabProperties.name)!);
      return;
    }

    const index = this.tabs.length;
    this.functionalTabs.set(tabProperties.name, index);

    const tabIndex = this.getTabIndex();
    const $view = await tabProperties.makeView();
    this.$webviewsContainer.append($view);

    this.tabs.push(
      new FunctionalTab({
        role: "function",
        materialIcon: tabProperties.materialIcon,
        name: tabProperties.name,
        $root: this.$tabsContainer,
        index,
        tabIndex,
        onClick: this.activateTab.bind(this, index),
        onDestroy: async () => {
          await this.destroyTab(tabProperties.name, index);
          tabProperties.destroyView();
        },
        $view,
      }),
    );

    // To show loading indicator the first time a functional tab is opened, indicator is
    // closed when the functional tab DOM is ready, handled in webview.js
    this.$webviewsContainer.classList.remove("loaded");

    await this.activateTab(this.functionalTabs.get(tabProperties.name)!);
  }

  async openSettings(
    navigationItem: NavigationItem = "General",
  ): Promise<void> {
    await this.openFunctionalTab({
      name: "Settings",
      materialIcon: "settings",
      makeView: async () => {
        this.preferenceView = await PreferenceView.create();
        this.preferenceView.$view.classList.add("functional-view");
        return this.preferenceView.$view;
      },
      destroyView: () => {
        this.preferenceView!.destroy();
        this.preferenceView = undefined;
      },
    });
    this.$settingsButton.classList.add("active");
    this.preferenceView!.handleNavigation(navigationItem);
  }

  async openAbout(): Promise<void> {
    let aboutView: AboutView;
    await this.openFunctionalTab({
      name: "About",
      materialIcon: "sentiment_very_satisfied",
      async makeView() {
        aboutView = await AboutView.create();
        aboutView.$view.classList.add("functional-view");
        return aboutView.$view;
      },
      destroyView() {
        aboutView.destroy();
      },
    });
  }

  async openNetworkTroubleshooting(index: number): Promise<void> {
    const tab = this.tabs[index];
    if (!(tab instanceof ServerTab)) return;
    const webview = await tab.webview;
    const reconnectUtil = new ReconnectUtil(webview);
    reconnectUtil.pollInternetAndReload();
    await webview
      .getWebContents()
      .loadURL(new URL("app/renderer/network.html", bundleUrl).href);
  }

  async activateLastTab(index: number): Promise<void> {
    // Open all the tabs in background, also activate the tab based on the index
    await this.activateTab(index);
    // Save last active tab via main process to avoid JSON DB errors
    ipcRenderer.send("save-last-tab", index);
  }

  // Returns this.tabs in an way that does
  // not crash app when this.tabs is passed into
  // ipcRenderer. Something about webview, and properties.webview
  // properties in ServerTab causes the app to crash.
  get tabsForIpc(): TabData[] {
    return this.tabs.map((tab) => ({
      role: tab.properties.role,
      name: tab.properties.name,
      index: tab.properties.index,
    }));
  }

  async activateTab(index: number, hideOldTab = true): Promise<void> {
    const tab = this.tabs[index];
    if (!tab) {
      return;
    }

    if (this.activeTabIndex !== -1) {
      if (this.activeTabIndex === index) {
        return;
      }

      if (hideOldTab) {
        // If old tab is functional tab Settings, remove focus from the settings icon at sidebar bottom
        if (
          this.tabs[this.activeTabIndex].properties.role === "function" &&
          this.tabs[this.activeTabIndex].properties.name === "Settings"
        ) {
          this.$settingsButton.classList.remove("active");
        }

        await this.tabs[this.activeTabIndex].deactivate();
      }
    }

    if (tab instanceof ServerTab) {
      try {
        (await tab.webview).canGoBackButton();
      } catch {}
    } else {
      document
        .querySelector("#actions-container #back-action")!
        .classList.add("disable");
    }

    this.activeTabIndex = index;
    await tab.activate();

    this.showLoading(
      tab instanceof ServerTab &&
        this.loading.has((await tab.webview).properties.url),
    );

    ipcRenderer.send("update-menu", {
      // JSON stringify this.tabs to avoid a crash
      // util.inspect is being used to handle circular references
      tabs: this.tabsForIpc,
      activeTabIndex: this.activeTabIndex,
      // Following flag controls whether a menu item should be enabled or not
      enableMenu: tab.properties.role === "server",
    });
  }

  showLoading(loading: boolean): void {
    this.$reloadButton.classList.toggle("hidden", loading);
    this.$loadingIndicator.classList.toggle("hidden", !loading);
  }

  async destroyTab(name: string, index: number): Promise<void> {
    const tab = this.tabs[index];
    if (tab instanceof ServerTab && (await tab.webview).loading) {
      return;
    }

    await tab.destroy();

    delete this.tabs[index]; // eslint-disable-line @typescript-eslint/no-array-delete
    this.functionalTabs.delete(name);

    // Issue #188: If the functional tab was not focused, do not activate another tab.
    if (this.activeTabIndex === index) {
      await this.activateTab(0, false);
    }
  }

  destroyView(): void {
    // Show loading indicator
    this.$webviewsContainer.classList.remove("loaded");

    // Clear global variables
    this.activeTabIndex = -1;
    this.tabs = [];
    this.functionalTabs.clear();

    // Clear DOM elements
    this.$tabsContainer.textContent = "";
    this.$webviewsContainer.textContent = "";
  }

  async reloadView(): Promise<void> {
    // Save and remember the index of last active tab so that we can use it later
    const lastActiveTab = this.tabs[this.activeTabIndex].properties.index;
    ConfigUtil.setConfigItem("lastActiveTab", lastActiveTab);

    // Destroy the current view and re-initiate it
    this.destroyView();
    await this.initTabs();
    this.initServerActions();
  }

  // This will trigger when pressed CTRL/CMD + R [WIP]
  // It won't reload the current view properly when you add/delete a server.
  reloadCurrentView(): void {
    this.$reloadButton.click();
  }

  async updateBadge(): Promise<void> {
    let messageCountAll = 0;
    await Promise.all(
      this.tabs.map(async (tab) => {
        if (tab && tab instanceof ServerTab && tab.updateBadge) {
          const count = (await tab.webview).badgeCount;
          messageCountAll += count;
          tab.updateBadge(count);
        }
      }),
    );

    ipcRenderer.send("update-badge", messageCountAll);
  }

  toggleSidebar(show: boolean): void {
    this.$sidebar.classList.toggle("sidebar-hide", !show);
  }

  // Toggles the dnd button icon.
  toggleDndButton(alert: boolean): void {
    this.$dndTooltip.textContent =
      (alert ? "Disable" : "Enable") + " Do Not Disturb";
    this.$dndButton.querySelector("i")!.textContent = alert
      ? "notifications_off"
      : "notifications";
  }

  async isLoggedIn(tabIndex: number): Promise<boolean> {
    const tab = this.tabs[tabIndex];
    if (!(tab instanceof ServerTab)) return false;
    const webview = await tab.webview;
    const url = webview.getWebContents().getURL();
    return !(url.endsWith("/login/") || webview.loading);
  }

  addContextMenu($serverImg: HTMLElement, index: number): void {
    $serverImg.addEventListener("contextmenu", async (event) => {
      event.preventDefault();
      const template = [
        {
          label: "Disconnect organization",
          async click() {
            const {response} = await dialog.showMessageBox({
              type: "warning",
              buttons: ["YES", "NO"],
              defaultId: 0,
              message: "Are you sure you want to disconnect this organization?",
            });
            if (response === 0) {
              if (DomainUtil.removeDomain(index)) {
                ipcRenderer.send("reload-full-app");
              } else {
                const {title, content} = Messages.orgRemovalError(
                  DomainUtil.getDomain(index).url,
                );
                dialog.showErrorBox(title, content);
              }
            }
          },
        },
        {
          label: "Notification settings",
          enabled: await this.isLoggedIn(index),
          click: async () => {
            // Switch to tab whose icon was right-clicked
            await this.activateTab(index);
            const tab = this.tabs[index];
            if (tab instanceof ServerTab)
              (await tab.webview).showNotificationSettings();
          },
        },
        {
          label: "Copy Zulip URL",
          click() {
            clipboard.writeText(DomainUtil.getDomain(index).url);
          },
        },
      ];
      const contextMenu = Menu.buildFromTemplate(template);
      contextMenu.popup({window: remote.getCurrentWindow()});
    });
  }

  registerIpcs(): void {
    const webviewListeners: Array<
      [WebviewListener, (webview: WebView) => void]
    > = [
      [
        "webview-reload",
        (webview) => {
          webview.reload();
        },
      ],
      [
        "back",
        (webview) => {
          webview.back();
        },
      ],
      [
        "focus",
        (webview) => {
          webview.focus();
        },
      ],
      [
        "forward",
        (webview) => {
          webview.forward();
        },
      ],
      [
        "zoomIn",
        (webview) => {
          webview.zoomIn();
        },
      ],
      [
        "zoomOut",
        (webview) => {
          webview.zoomOut();
        },
      ],
      [
        "zoomActualSize",
        (webview) => {
          webview.zoomActualSize();
        },
      ],
      [
        "log-out",
        (webview) => {
          webview.logOut();
        },
      ],
      [
        "show-keyboard-shortcuts",
        (webview) => {
          webview.showKeyboardShortcuts();
        },
      ],
      [
        "tab-devtools",
        (webview) => {
          webview.openDevTools();
        },
      ],
    ];

    for (const [channel, listener] of webviewListeners) {
      ipcRenderer.on(channel, async () => {
        const tab = this.tabs[this.activeTabIndex];
        if (tab instanceof ServerTab) {
          const activeWebview = await tab.webview;
          if (activeWebview) listener(activeWebview);
        }
      });
    }

    ipcRenderer.on(
      "permission-request",
      async (
        event,
        {
          webContentsId,
          origin,
          permission,
        }: {
          webContentsId: number | null;
          origin: string;
          permission: string;
        },
        permissionCallbackId: number,
      ) => {
        const grant =
          webContentsId === null
            ? origin === "null" && permission === "notifications"
            : (
                await Promise.all(
                  this.tabs.map(async (tab) => {
                    if (!(tab instanceof ServerTab)) return false;
                    const webview = await tab.webview;
                    return (
                      webview.webContentsId === webContentsId &&
                      webview.properties.hasPermission?.(origin, permission)
                    );
                  }),
                )
              ).some(Boolean);
        console.log(
          grant ? "Granted" : "Denied",
          "permissions request for",
          permission,
          "from",
          origin,
        );
        ipcRenderer.send("permission-callback", permissionCallbackId, grant);
      },
    );

    ipcRenderer.on("open-settings", async () => {
      await this.openSettings();
    });

    ipcRenderer.on("open-about", this.openAbout.bind(this));

    ipcRenderer.on("open-help", async () => {
      // Open help page of current active server
      await LinkUtil.openBrowser(new URL("https://zulip.com/help/"));
    });

    ipcRenderer.on("reload-viewer", this.reloadView.bind(this));

    ipcRenderer.on("reload-current-viewer", this.reloadCurrentView.bind(this));

    ipcRenderer.on("hard-reload", () => {
      ipcRenderer.send("reload-full-app");
    });

    ipcRenderer.on("switch-server-tab", async (event, index: number) => {
      await this.activateLastTab(index);
    });

    ipcRenderer.on("open-org-tab", async () => {
      await this.openSettings("AddServer");
    });

    ipcRenderer.on("reload-proxy", async (event, showAlert: boolean) => {
      await this.loadProxy();
      if (showAlert) {
        await dialog.showMessageBox({
          message: "Proxy settings saved!",
          buttons: ["OK"],
        });
        ipcRenderer.send("reload-full-app");
      }
    });

    ipcRenderer.on("toggle-sidebar", async (event, show: boolean) => {
      // Toggle the left sidebar
      this.toggleSidebar(show);
    });

    ipcRenderer.on("toggle-silent", async (event, state: boolean) =>
      Promise.all(
        this.tabs.map(async (tab) => {
          if (tab instanceof ServerTab)
            (await tab.webview).getWebContents().setAudioMuted(state);
        }),
      ),
    );

    ipcRenderer.on(
      "toggle-autohide-menubar",
      async (event, autoHideMenubar: boolean, updateMenu: boolean) => {
        if (updateMenu) {
          ipcRenderer.send("update-menu", {
            tabs: this.tabsForIpc,
            activeTabIndex: this.activeTabIndex,
          });
        }
      },
    );

    ipcRenderer.on(
      "toggle-dnd",
      async (event, state: boolean, newSettings: Partial<DndSettings>) => {
        this.toggleDndButton(state);
        ipcRenderer.send(
          "forward-message",
          "toggle-silent",
          newSettings.silent ?? false,
        );
      },
    );

    ipcRenderer.on(
      "update-realm-name",
      (event, serverURL: string, realmName: string) => {
        for (const [index, domain] of DomainUtil.getDomains().entries()) {
          if (domain.url === serverURL) {
            const tab = this.tabs[index];
            if (tab instanceof ServerTab) tab.setName(realmName);
            domain.alias = realmName;
            DomainUtil.updateDomain(index, domain);
            // Update the realm name also on the Window menu
            ipcRenderer.send("update-menu", {
              tabs: this.tabsForIpc,
              activeTabIndex: this.activeTabIndex,
            });
          }
        }
      },
    );

    ipcRenderer.on(
      "update-realm-icon",
      async (event, serverURL: string, iconURL: string) => {
        await Promise.all(
          DomainUtil.getDomains().map(async (domain, index) => {
            if (domain.url === serverURL) {
              const localIconPath = await DomainUtil.saveServerIcon(iconURL);
              const tab = this.tabs[index];
              if (tab instanceof ServerTab)
                tab.setIcon(DomainUtil.iconAsUrl(localIconPath));
              domain.icon = localIconPath;
              DomainUtil.updateDomain(index, domain);
            }
          }),
        );
      },
    );

    ipcRenderer.on("enter-fullscreen", () => {
      this.$fullscreenPopup.classList.add("show");
      this.$fullscreenPopup.classList.remove("hidden");
    });

    ipcRenderer.on("leave-fullscreen", () => {
      this.$fullscreenPopup.classList.remove("show");
    });

    ipcRenderer.on("focus-webview-with-id", async (event, webviewId: number) =>
      Promise.all(
        this.tabs.map(async (tab) => {
          if (
            tab instanceof ServerTab &&
            (await tab.webview).webContentsId === webviewId
          ) {
            const concurrentTab: HTMLButtonElement = document.querySelector(
              `div[data-tab-id="${CSS.escape(`${tab.properties.tabIndex}`)}"]`,
            )!;
            concurrentTab.click();
          }
        }),
      ),
    );

    ipcRenderer.on("render-taskbar-icon", (event, messageCount: number) => {
      // Create a canvas from unread message counts
      function createOverlayIcon(messageCount: number): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.height = 128;
        canvas.width = 128;
        canvas.style.letterSpacing = "-5px";
        const context = canvas.getContext("2d")!;
        context.fillStyle = "#f42020";
        context.beginPath();
        context.ellipse(64, 64, 64, 64, 0, 0, 2 * Math.PI);
        context.fill();
        context.textAlign = "center";
        context.fillStyle = "white";
        if (messageCount > 99) {
          context.font = "65px Helvetica";
          context.fillText("99+", 64, 85);
        } else if (messageCount < 10) {
          context.font = "90px Helvetica";
          context.fillText(String(Math.min(99, messageCount)), 64, 96);
        } else {
          context.font = "85px Helvetica";
          context.fillText(String(Math.min(99, messageCount)), 64, 90);
        }

        return canvas;
      }

      ipcRenderer.send(
        "update-taskbar-icon",
        createOverlayIcon(messageCount).toDataURL(),
        String(messageCount),
      );
    });

    ipcRenderer.on("copy-zulip-url", async () => {
      clipboard.writeText(await this.getCurrentActiveServer());
    });

    ipcRenderer.on("new-server", async () => {
      await this.openSettings("AddServer");
    });

    ipcRenderer.on("set-active", async () =>
      Promise.all(
        this.tabs.map(async (tab) => {
          if (tab instanceof ServerTab) (await tab.webview).send("set-active");
        }),
      ),
    );

    ipcRenderer.on("set-idle", async () =>
      Promise.all(
        this.tabs.map(async (tab) => {
          if (tab instanceof ServerTab) (await tab.webview).send("set-idle");
        }),
      ),
    );

    ipcRenderer.on("open-network-settings", async () => {
      await this.openSettings("Network");
    });

    ipcRenderer.on("play-ding-sound", async () => {
      await dingSound.play();
    });
  }
}

window.addEventListener("load", async () => {
  const serverManagerView = new ServerManagerView();
  await serverManagerView.init();
});
