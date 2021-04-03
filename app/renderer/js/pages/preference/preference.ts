import {ipcRenderer} from "electron";

import type {DNDSettings} from "../../../../common/dnd-util";

import {initConnectedOrgSection} from "./connected-org-section";
import {initGeneralSection} from "./general-section";
import Nav from "./nav";
import type {NavItem} from "./nav";
import {initNetworkSection} from "./network-section";
import {initServersSection} from "./servers-section";
import {initShortcutsSection} from "./shortcuts-section";

export function initPreferenceView(): void {
  const $sidebarContainer = document.querySelector("#sidebar")!;
  const $settingsContainer = document.querySelector("#settings-container")!;

  const nav = new Nav({
    $root: $sidebarContainer,
    onItemSelected: handleNavigation,
  });

  const navItem =
    nav.navItems.find((navItem) => window.location.hash === `#${navItem}`) ??
    "General";

  handleNavigation(navItem);

  function handleNavigation(navItem: NavItem): void {
    nav.select(navItem);
    switch (navItem) {
      case "AddServer":
        initServersSection({
          $root: $settingsContainer,
        });
        break;

      case "General":
        initGeneralSection({
          $root: $settingsContainer,
        });
        break;

      case "Organizations":
        initConnectedOrgSection({
          $root: $settingsContainer,
        });
        break;

      case "Network":
        initNetworkSection({
          $root: $settingsContainer,
        });
        break;

      case "Shortcuts": {
        initShortcutsSection({
          $root: $settingsContainer,
        });
        break;
      }

      default:
        ((n: never) => n)(navItem);
    }

    window.location.hash = `#${navItem}`;
  }

  // Handle toggling and reflect changes in preference page
  function handleToggle(elementName: string, state = false): void {
    const inputSelector = `#${elementName} .action .switch input`;
    const input: HTMLInputElement = document.querySelector(inputSelector)!;
    if (input) {
      input.checked = state;
    }
  }

  ipcRenderer.on("switch-settings-nav", (_event: Event, navItem: NavItem) => {
    handleNavigation(navItem);
  });

  ipcRenderer.on("toggle-sidebar-setting", (_event: Event, state: boolean) => {
    handleToggle("sidebar-option", state);
  });

  ipcRenderer.on("toggle-menubar-setting", (_event: Event, state: boolean) => {
    handleToggle("menubar-option", state);
  });

  ipcRenderer.on("toggletray", (_event: Event, state: boolean) => {
    handleToggle("tray-option", state);
  });

  ipcRenderer.on(
    "toggle-dnd",
    (_event: Event, _state: boolean, newSettings: DNDSettings) => {
      handleToggle("show-notification-option", newSettings.showNotification);
      handleToggle("silent-option", newSettings.silent);

      if (process.platform === "win32") {
        handleToggle("flash-taskbar-option", newSettings.flashTaskbarOnMessage);
      }
    },
  );
}

window.addEventListener("load", initPreferenceView);
