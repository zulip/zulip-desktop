import type {HTML} from "../../../common/html.js";
import {html} from "../../../common/html.js";

import {generateNodeFromHTML} from "./base.js";
import type {TabProps} from "./tab.js";
import Tab from "./tab.js";

export interface FunctionalTabProps extends TabProps {
  $view: Element;
}

export default class FunctionalTab extends Tab {
  $view: Element;
  $el: Element;
  $closeButton?: Element;

  constructor({$view, ...props}: FunctionalTabProps) {
    super(props);

    this.$view = $view;
    this.$el = generateNodeFromHTML(this.templateHTML());
    if (this.props.name !== "Settings") {
      this.props.$root.append(this.$el);
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

  templateHTML(): HTML {
    return html`
      <div class="tab functional-tab" data-tab-id="${this.props.tabIndex}">
        <div class="server-tab-badge close-button">
          <i class="material-icons">close</i>
        </div>
        <div class="server-tab">
          <i class="material-icons">${this.props.materialIcon}</i>
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

    this.$closeButton?.addEventListener("click", (event: Event) => {
      this.props.onDestroy?.();
      event.stopPropagation();
    });
  }
}
