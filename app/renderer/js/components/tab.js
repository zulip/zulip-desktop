'use strict';

const BaseComponent = require(__dirname + '/../components/base.js');

class Tab extends BaseComponent {
	constructor(props) {
		super();

		this.props = props;
		this.webview = this.props.webview;

		this.init();
	}

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$el);

		this.registerListeners();
	}

	registerListeners() {
		this.$el.addEventListener('click', this.props.onClick);
		this.$el.addEventListener('mouseover', this.props.onHover);
		this.$el.addEventListener('mouseout', this.props.onHoverOut);
	}

	isLoading() {
		return this.webview.isLoading;
	}

	activate() {
		this.$el.classList.add('active');
		this.webview.load();
	}

	deactivate() {
		this.$el.classList.remove('active');
		this.webview.hide();
	}

	destroy() {
		this.$el.parentNode.removeChild(this.$el);
		this.webview.$el.parentNode.removeChild(this.webview.$el);
	}
}

module.exports = Tab;
