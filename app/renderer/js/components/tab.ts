import WebView from './webview';
import BaseComponent from './base';
import Dialog from './dialog';

export interface TabProps {
	role: string;
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

export default class Tab extends BaseComponent {
	props: TabProps;
	webview: WebView;
	dialog: Dialog;
	$el: Element;

	constructor(props: TabProps) {
		super();

		this.props = props;
		this.webview = this.props.webview;
		this.dialog = new Dialog();
	}

	registerListeners(): void {
		this.$el.addEventListener('click', this.props.onClick);
		this.$el.addEventListener('mouseover', this.props.onHover);
		this.$el.addEventListener('mouseout', this.props.onHoverOut);
	}

	showNetworkError(): void {
		this.webview.forceLoad();
	}

	activate(): void {
		this.$el.classList.add('active');
		this.dialog.show();
		this.webview.load();
	}

	deactivate(): void {
		this.$el.classList.remove('active');
		this.dialog.hide();
		this.webview.hide();
	}

	destroy(): void {
		this.$el.remove();
		this.webview.$el.remove();
	}
}
