import type {TabRole} from "../../../common/types.js";

export type TabProperties = {
  role: TabRole;
  icon?: string;
  name: string;
  $root: Element;
  onClick: () => void;
  index: number;
  tabIndex: number;
  onHover?: () => void;
  onHoverOut?: () => void;
  materialIcon?: string;
  onDestroy?: () => void;
};

export default abstract class Tab {
  abstract $el: Element;

  constructor(readonly properties: TabProperties) {}

  registerListeners(): void {
    this.$el.addEventListener("click", this.properties.onClick);

    if (this.properties.onHover !== undefined) {
      this.$el.addEventListener("mouseover", this.properties.onHover);
    }

    if (this.properties.onHoverOut !== undefined) {
      this.$el.addEventListener("mouseout", this.properties.onHoverOut);
    }
  }

  async activate(): Promise<void> {
    this.$el.classList.add("active");
  }

  async deactivate(): Promise<void> {
    this.$el.classList.remove("active");
  }

  async destroy(): Promise<void> {
    this.$el.remove();
  }
}
