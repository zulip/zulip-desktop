import type {HTML} from "../../../common/html";
import {html} from "../../../common/html";

import {generateNodeFromHTML} from "./base";
import type {TabProps} from "./tab";
import Tab from "./tab";

export default class FunctionalTab extends Tab {
  $el: Element;
  $closeButton?: Element;

  constructor(props: TabProps) {
    super(props);

    this.$el = generateNodeFromHTML(this.templateHTML());
    if (this.props.name !== "Settings") {
      this.props.$root.append(this.$el);
      this.$closeButton = this.$el.querySelector(".server-tab-badge")!;
      this.registerListeners();
    }
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
