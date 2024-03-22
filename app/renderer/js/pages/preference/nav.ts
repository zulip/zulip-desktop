import {type Html, html} from "../../../../common/html.js";
import * as t from "../../../../common/translation-util.js";
import type {NavigationItem} from "../../../../common/types.js";
import {generateNodeFromHtml} from "../../components/base.js";

type PreferenceNavigationProperties = {
  $root: Element;
  onItemSelected: (navigationItem: NavigationItem) => void;
};

export default class PreferenceNavigation {
  navigationItems: NavigationItem[];
  $el: Element;
  constructor(private readonly properties: PreferenceNavigationProperties) {
    this.navigationItems = [
      "General",
      "Network",
      "AddServer",
      "Organizations",
      "Shortcuts",
    ];

    this.$el = generateNodeFromHtml(this.templateHtml());
    this.properties.$root.append(this.$el);
    this.registerListeners();
  }

  templateHtml(): Html {
    const navigationItemsHtml = html``.join(
      this.navigationItems.map(
        (navigationItem) => html`
          <div class="nav" id="nav-${navigationItem}">
            ${t.__(navigationItem)}
          </div>
        `,
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
    for (const navigationItem of this.navigationItems) {
      const $item = this.$el.querySelector(
        `#nav-${CSS.escape(navigationItem)}`,
      )!;
      $item.addEventListener("click", () => {
        this.properties.onItemSelected(navigationItem);
      });
    }
  }

  select(navigationItemToSelect: NavigationItem): void {
    for (const navigationItem of this.navigationItems) {
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
