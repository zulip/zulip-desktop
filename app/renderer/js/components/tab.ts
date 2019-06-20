'use strict';

import BaseComponent = require('./base');

// TODO: TypeScript - Type annotate props
interface TabProps {
	[key: string]: any;
}

class Tab extends BaseComponent {
	props: TabProps;
	webview: any;
	$el: Element;
	constructor(props: TabProps) {
		super();

		this.props = props;
		this.webview = this.props.webview;

		this.init();
	}

	init(): void {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.append(this.$el);
		this.registerListeners();
	}

	registerListeners(): void {
		this.$el.addEventListener('click', this.props.onClick);
		this.$el.addEventListener('mouseover', this.props.onHover);
		this.$el.addEventListener('mouseout', this.props.onHoverOut);
	}

	activate(): void {
		this.$el.classList.add('active');
		this.webview.load();
	}

	deactivate(): void {
		this.$el.classList.remove('active');
		this.webview.hide();
	}

	destroy(): void {
		this.$el.parentNode.removeChild(this.$el);
		this.webview.$el.parentNode.removeChild(this.webview.$el);
	}
}

export = Tab;
