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
		this.$badge = this.$el.getElementsByClassName('server-tab-badge')[0];
		this.props.$root.appendChild(this.$el);

		this.registerListeners();
	}

	updateBadge(count) {
		if (count > 0) {
			const formattedCount = count > 999 ? '1K+' : count;

			this.$badge.innerHTML = formattedCount;
			this.$badge.classList.add('active');
		} else {
			this.$badge.classList.remove('active');
		}
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
