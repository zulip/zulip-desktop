import type {TabRole} from "../../../common/types";

import type WebView from "./webview";

export interface TabProps {
  role: TabRole;
  icon?: string;
  name: string;
  $root: Element;
  onClick: () => void;
  index: number;
  tabIndex: number;
  onHover?: () => void;
  onHoverOut?: () => void;
  webview: WebView;
  materialIcon?: string;
  onDestroy?: () => void;
}

export default abstract class Tab {
  props: TabProps;
  webview: WebView;
  abstract $el: Element;

  constructor(props: TabProps) {
    this.props = props;
    this.webview = this.props.webview;
  }

  registerListeners(): void {
    this.$el.addEventListener("click", this.props.onClick);

    if (this.props.onHover !== undefined) {
      this.$el.addEventListener("mouseover", this.props.onHover);
    }

    if (this.props.onHoverOut !== undefined) {
      this.$el.addEventListener("mouseout", this.props.onHoverOut);
    }
  }

  showNetworkError(): void {
    this.webview.forceLoad();
  }

  activate(): void {
    this.$el.classList.add("active");
    this.webview.load();
  }

  deactivate(): void {
    this.$el.classList.remove("active");
    this.webview.hide();
  }

  destroy(): void {
    this.$el.remove();
    this.webview.$el!.remove();
  }
}
