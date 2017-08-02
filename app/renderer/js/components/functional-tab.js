'use strict';

const Tab = require(__dirname + '/../components/tab.js');

class FunctionalTab extends Tab {
	template() {
		return `<div class="tab functional-tab">
					<div class="server-tab-badge close-button">
						<i class="material-icons">close</i>
					</div>
					<div class="server-tab">
						<i class="material-icons">${this.props.materialIcon}</i>
					</div>
				</div>`;
	}

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$el);

		this.$closeButton = this.$el.getElementsByClassName('server-tab-badge')[0];
		this.registerListeners();
	}

	registerListeners() {
		super.registerListeners();

		this.$el.addEventListener('mouseover', () => {
			this.$closeButton.classList.add('active');
		});

		this.$el.addEventListener('mouseout', () => {
			this.$closeButton.classList.remove('active');
		});

		this.$closeButton.addEventListener('click', e => {
			this.props.onDestroy();
			e.stopPropagation();
		});
	}
}

module.exports = FunctionalTab;
