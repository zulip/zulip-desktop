import type {IpcRendererEvent} from "electron/renderer";
import process from "node:process";

import type {DndSettings} from "../../../../common/dnd-util.ts";
import {bundleUrl} from "../../../../common/paths.ts";
import type {NavigationItem} from "../../../../common/types.ts";
import {ipcRenderer} from "../../typed-ipc-renderer.ts";

import {initConnectedOrgSection} from "./connected-org-section.ts";
import {initGeneralSection} from "./general-section.ts";
import Nav from "./nav.ts";
import {initNetworkSection} from "./network-section.ts";
import {initServersSection} from "./servers-section.ts";
import {initShortcutsSection} from "./shortcuts-section.ts";

export class PreferenceView {
  static async create(): Promise<PreferenceView> {
    return new PreferenceView(
      await (
        await fetch(new URL("app/renderer/preference.html", bundleUrl))
      ).text(),
    );
  }

  readonly $view: HTMLElement;
  private readonly $shadow: ShadowRoot;
  private readonly $settingsContainer: Element;
  private readonly nav: Nav;
  private navigationItem: NavigationItem = "General";

  private constructor(templateHtml: string) {
    this.$view = document.createElement("div");
    this.$shadow = this.$view.attachShadow({mode: "open"});
    this.$shadow.innerHTML = templateHtml;

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

    this.handleNavigation(this.navigationItem);
  }

  handleNavigation = (navigationItem: NavigationItem): void => {
    this.navigationItem = navigationItem;
    this.nav.select(navigationItem);
    switch (navigationItem) {
      case "AddServer": {
        initServersSection({
          $root: this.$settingsContainer,
        });
        break;
      }

      case "General": {
        initGeneralSection({
          $root: this.$settingsContainer,
        });
        break;
      }

      case "Organizations": {
        initConnectedOrgSection({
          $root: this.$settingsContainer,
        });
        break;
      }

      case "Network": {
        initNetworkSection({
          $root: this.$settingsContainer,
        });
        break;
      }

      case "Shortcuts": {
        initShortcutsSection({
          $root: this.$settingsContainer,
        });
        break;
      }
    }

    location.hash = `#${navigationItem}`;
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

  private readonly handleToggleSidebar = (
    _event: IpcRendererEvent,
    state: boolean,
  ) => {
    this.handleToggle("sidebar-option", state);
  };

  private readonly handleToggleMenubar = (
    _event: IpcRendererEvent,
    state: boolean,
  ) => {
    this.handleToggle("menubar-option", state);
  };

  private readonly handleToggleDnd = (
    _event: IpcRendererEvent,
    _state: boolean,
    newSettings: Partial<DndSettings>,
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
