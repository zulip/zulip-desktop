import {ipcRenderer} from "electron";

import type {DNDSettings} from "../../../../common/dnd-util";

import ConnectedOrgSection from "./connected-org-section";
import GeneralSection from "./general-section";
import Nav from "./nav";
import type {NavItem} from "./nav";
import NetworkSection from "./network-section";
import ServersSection from "./servers-section";
import ShortcutsSection from "./shortcuts-section";

type Section =
  | ServersSection
  | GeneralSection
  | NetworkSection
  | ConnectedOrgSection
  | ShortcutsSection;

export default class PreferenceView {
  $sidebarContainer: Element;
  $settingsContainer: Element;
  nav: Nav;
  section: Section;
  constructor() {
    this.$sidebarContainer = document.querySelector("#sidebar");
    this.$settingsContainer = document.querySelector("#settings-container");
  }

  init(): void {
    this.nav = new Nav({
      $root: this.$sidebarContainer,
      onItemSelected: this.handleNavigation.bind(this),
    });

    this.setDefaultView();
    this.registerIpcs();
  }

  setDefaultView(): void {
    const navItem =
      this.nav.navItems.find(
        (navItem) => window.location.hash === `#${navItem}`,
      ) ?? "General";

    this.handleNavigation(navItem);
  }

  handleNavigation(navItem: NavItem): void {
    this.nav.select(navItem);
    switch (navItem) {
      case "AddServer": {
        this.section = new ServersSection({
          $root: this.$settingsContainer,
        });
        this.section.init();
        break;
      }

      case "General": {
        this.section = new GeneralSection({
          $root: this.$settingsContainer,
        });
        this.section.init();
        break;
      }

      case "Organizations": {
        this.section = new ConnectedOrgSection({
          $root: this.$settingsContainer,
        });
        this.section.init();
        break;
      }

      case "Network": {
        this.section = new NetworkSection({
          $root: this.$settingsContainer,
        });
        this.section.init();
        break;
      }

      case "Shortcuts": {
        this.section = new ShortcutsSection({
          $root: this.$settingsContainer,
        });
        this.section.init();
        break;
      }

      default:
        ((n: never) => n)(navItem);
    }

    window.location.hash = `#${navItem}`;
  }

  // Handle toggling and reflect changes in preference page
  handleToggle(elementName: string, state: boolean): void {
    const inputSelector = `#${elementName} .action .switch input`;
    const input: HTMLInputElement = document.querySelector(inputSelector);
    if (input) {
      input.checked = state;
    }
  }

  registerIpcs(): void {
    ipcRenderer.on("switch-settings-nav", (_event: Event, navItem: NavItem) => {
      this.handleNavigation(navItem);
    });

    ipcRenderer.on(
      "toggle-sidebar-setting",
      (_event: Event, state: boolean) => {
        this.handleToggle("sidebar-option", state);
      },
    );

    ipcRenderer.on(
      "toggle-menubar-setting",
      (_event: Event, state: boolean) => {
        this.handleToggle("menubar-option", state);
      },
    );

    ipcRenderer.on("toggletray", (_event: Event, state: boolean) => {
      this.handleToggle("tray-option", state);
    });

    ipcRenderer.on(
      "toggle-dnd",
      (_event: Event, _state: boolean, newSettings: DNDSettings) => {
        this.handleToggle(
          "show-notification-option",
          newSettings.showNotification,
        );
        this.handleToggle("silent-option", newSettings.silent);

        if (process.platform === "win32") {
          this.handleToggle(
            "flash-taskbar-option",
            newSettings.flashTaskbarOnMessage,
          );
        }
      },
    );
  }
}

window.addEventListener("load", () => {
  const preferenceView = new PreferenceView();
  preferenceView.init();
});
