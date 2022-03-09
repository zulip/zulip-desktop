import type {DNDSettings} from "../../../../common/dnd-util.js";
import {html} from "../../../../common/html.js";
import type {NavItem} from "../../../../common/types.js";
import {ipcRenderer} from "../../typed-ipc-renderer.js";

import {initConnectedOrgSection} from "./connected-org-section.js";
import {initGeneralSection} from "./general-section.js";
import Nav from "./nav.js";
import {initNetworkSection} from "./network-section.js";
import {initServersSection} from "./servers-section.js";
import {initShortcutsSection} from "./shortcuts-section.js";

export class PreferenceView {
  readonly $view: HTMLElement;
  private readonly $shadow: ShadowRoot;
  private readonly $settingsContainer: Element;
  private readonly nav: Nav;
  private navItem: NavItem = "General";

  constructor() {
    this.$view = document.createElement("div");
    this.$shadow = this.$view.attachShadow({mode: "open"});
    this.$shadow.innerHTML = html`
      <link
        rel="stylesheet"
        href="${require.resolve("../../../css/fonts.css")}"
      />
      <link
        rel="stylesheet"
        href="${require.resolve("../../../css/preference.css")}"
      />
      <link
        rel="stylesheet"
        href="${require.resolve("@yaireo/tagify/dist/tagify.css")}"
      />
      <!-- Initially hidden to prevent FOUC -->
      <div id="content" hidden>
        <div id="sidebar"></div>
        <div id="settings-container"></div>
      </div>
    `.html;

    const $sidebarContainer = this.$shadow.querySelector("#sidebar")!;
    this.$settingsContainer = this.$shadow.querySelector(
      "#settings-container",
    )!;

    this.nav = new Nav({
      $root: $sidebarContainer,
      onItemSelected: this.handleNavigation,
    });

    ipcRenderer.on("toggle-sidebar", this.handleToggleSidebar);
    ipcRenderer.on("toggle-autohide-menubar", this.handleToggleMenubar);
    ipcRenderer.on("toggle-dnd", this.handleToggleDnd);

    this.handleNavigation(this.navItem);
  }

  handleNavigation = (navItem: NavItem): void => {
    this.navItem = navItem;
    this.nav.select(navItem);
    switch (navItem) {
      case "AddServer":
        initServersSection({
          $root: this.$settingsContainer,
        });
        break;

      case "General":
        initGeneralSection({
          $root: this.$settingsContainer,
        });
        break;

      case "Organizations":
        initConnectedOrgSection({
          $root: this.$settingsContainer,
        });
        break;

      case "Network":
        initNetworkSection({
          $root: this.$settingsContainer,
        });
        break;

      case "Shortcuts": {
        initShortcutsSection({
          $root: this.$settingsContainer,
        });
        break;
      }

      default:
        ((n: never) => n)(navItem);
    }

    window.location.hash = `#${navItem}`;
  };

  handleToggleTray(state: boolean) {
    this.handleToggle("tray-option", state);
  }

  destroy(): void {
    ipcRenderer.off("toggle-sidebar", this.handleToggleSidebar);
    ipcRenderer.off("toggle-autohide-menubar", this.handleToggleMenubar);
    ipcRenderer.off("toggle-dnd", this.handleToggleDnd);
  }

  // Handle toggling and reflect changes in preference page
  private handleToggle(elementName: string, state = false): void {
    const inputSelector = `#${elementName} .action .switch input`;
    const input: HTMLInputElement = this.$shadow.querySelector(inputSelector)!;
    if (input) {
      input.checked = state;
    }
  }

  private readonly handleToggleSidebar = (_event: Event, state: boolean) => {
    this.handleToggle("sidebar-option", state);
  };

  private readonly handleToggleMenubar = (_event: Event, state: boolean) => {
    this.handleToggle("menubar-option", state);
  };

  private readonly handleToggleDnd = (
    _event: Event,
    _state: boolean,
    newSettings: Partial<DNDSettings>,
  ) => {
    this.handleToggle("show-notification-option", newSettings.showNotification);
    this.handleToggle("silent-option", newSettings.silent);

    if (process.platform === "win32") {
      this.handleToggle(
        "flash-taskbar-option",
        newSettings.flashTaskbarOnMessage,
      );
    }
  };
}
