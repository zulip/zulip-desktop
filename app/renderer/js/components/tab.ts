import type {TabPage, TabRole} from "../../../common/types.ts";

export type TabProperties = {
  role: TabRole;
  page?: TabPage;
  icon?: string;
  label: string;
  $root: Element;
  onClick: () => void;
  index: number;
  tabId: string;
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
