import {type Html, html} from "../../../../common/html.js";
import * as t from "../../../../common/translation-util.js";
import type {NavigationItem} from "../../../../common/types.js";
import {generateNodeFromHtml} from "../../components/base.js";

type PreferenceNavigationProperties = {
  $root: Element;
  onItemSelected: (navigationItem: NavigationItem) => void;
};

export default class PreferenceNavigation {
  navigationItems: Array<{navigationItem: NavigationItem; label: string}>;
  $el: Element;
  constructor(private readonly properties: PreferenceNavigationProperties) {
    this.navigationItems = [
      {navigationItem: "General", label: t.__("General")},
      {navigationItem: "Network", label: t.__("Network")},
      {navigationItem: "AddServer", label: t.__("Add Organization")},
      {navigationItem: "Organizations", label: t.__("Organizations")},
      {navigationItem: "Shortcuts", label: t.__("Shortcuts")},
    ];

    this.$el = generateNodeFromHtml(this.templateHtml());
    this.properties.$root.append(this.$el);
    this.registerListeners();
  }

  templateHtml(): Html {
    const navigationItemsHtml = html``.join(
      this.navigationItems.map(
        ({navigationItem, label}) =>
          html`<div class="nav" id="nav-${navigationItem}">${label}</div>`,
      ),
    );

    return html`
      <div>
        <div id="settings-header">${t.__("Settings")}</div>
        <div id="nav-container">${navigationItemsHtml}</div>
      </div>
    `;
  }

  registerListeners(): void {
    for (const {navigationItem} of this.navigationItems) {
      const $item = this.$el.querySelector(
        `#nav-${CSS.escape(navigationItem)}`,
      )!;
      $item.addEventListener("click", () => {
        this.properties.onItemSelected(navigationItem);
      });
    }
  }

  select(navigationItemToSelect: NavigationItem): void {
    for (const {navigationItem} of this.navigationItems) {
      if (navigationItem === navigationItemToSelect) {
        this.activate(navigationItem);
      } else {
        this.deactivate(navigationItem);
      }
    }
  }

  activate(navigationItem: NavigationItem): void {
    const $item = this.$el.querySelector(`#nav-${CSS.escape(navigationItem)}`)!;
    $item.classList.add("active");
  }

  deactivate(navigationItem: NavigationItem): void {
    const $item = this.$el.querySelector(`#nav-${CSS.escape(navigationItem)}`)!;
    $item.classList.remove("active");
  }
}
