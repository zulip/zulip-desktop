import {type Html, html} from "../../../common/html.js";

import {generateNodeFromHtml} from "./base.js";
import Tab, {type TabProperties} from "./tab.js";

export type FunctionalTabProperties = {
  $view: Element;
} & TabProperties;

export default class FunctionalTab extends Tab {
  $view: Element;
  $el: Element;
  $closeButton?: Element;

  constructor({$view, ...properties}: FunctionalTabProperties) {
    super(properties);

    this.$view = $view;
    this.$el = generateNodeFromHtml(this.templateHtml());
    if (this.properties.name !== "Settings") {
      this.properties.$root.append(this.$el);
      this.$closeButton = this.$el.querySelector(".server-tab-badge")!;
      this.registerListeners();
    }
  }

  override async activate(): Promise<void> {
    await super.activate();
    this.$view.classList.add("active");
  }

  override async deactivate(): Promise<void> {
    await super.deactivate();
    this.$view.classList.remove("active");
  }

  override async destroy(): Promise<void> {
    await super.destroy();
    this.$view.remove();
  }

  templateHtml(): Html {
    return html`
      <div class="tab functional-tab" data-tab-id="${this.properties.tabIndex}">
        <div class="server-tab-badge close-button">
          <i class="material-icons">close</i>
        </div>
        <div class="server-tab">
          <i class="material-icons">${this.properties.materialIcon}</i>
        </div>
      </div>
    `;
  }

  override registerListeners(): void {
    super.registerListeners();

    this.$el.addEventListener("mouseover", () => {
      this.$closeButton?.classList.add("active");
    });

    this.$el.addEventListener("mouseout", () => {
      this.$closeButton?.classList.remove("active");
    });

    this.$closeButton?.addEventListener("click", (event) => {
      this.properties.onDestroy?.();
      event.stopPropagation();
    });
  }
}
