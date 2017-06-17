'use strict';

const BaseComponent = require(__dirname + '/../components/base.js');

class Tab extends BaseComponent {
	constructor(props) {
		super();

		this.props = props;

		this.init();
	}

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$el);

		this.registerListeners();
	}

	registerListeners() {
		this.$el.addEventListener('click', this.props.onClick);
	}

	activate() {
		this.$el.classList.add('active');
	}

	deactivate() {
		this.$el.classList.remove('active');
	}
}

Tab.SERVER_TAB = 0;
Tab.SETTINGS_TAB = 1;

module.exports = Tab;
