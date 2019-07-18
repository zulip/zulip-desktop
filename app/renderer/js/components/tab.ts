'use strict';

import BaseComponent = require('./base');

// TODO: TypeScript - Type annotate props
interface TabProps {
	[key: string]: any;
}

class Tab extends BaseComponent {
	props: TabProps;
	$el: Element;
	constructor(props: TabProps) {
		super();
		this.props = props;
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
	}

	deactivate(): void {
		this.$el.classList.remove('active');
	}

	destroy(): void {
		this.$el.parentNode.removeChild(this.$el);
	}
}

export = Tab;
