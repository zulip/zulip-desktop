'use strict';

const BaseComponent = require(__dirname + '/../../components/base.js');

class PreferenceNav extends BaseComponent {
	constructor(props) {
		super();

		this.props = props;

		this.navItems = ['General', 'Servers'];

		this.init();
	}

	template() {
		let navItemsTemplate = '';
		for (const navItem of this.navItems) {
			navItemsTemplate += `<div class="nav" id="nav-${navItem}">${navItem}</div>`;
		}

		return `
			<div>
				<div id="settings-header">Settings</div>
				<div id="nav-container">${navItemsTemplate}</div>
			</div>
		`;
	}

	init() {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$el);

		this.registerListeners();
	}

	registerListeners() {
		for (const navItem of this.navItems) {
			const $item = document.getElementById(`nav-${navItem}`);
			$item.addEventListener('click', () => {
				this.props.onItemSelected(navItem);
			});
		}
	}

	select(navItemToSelect) {
		for (const navItem of this.navItems) {
			if (navItem === navItemToSelect) {
				this.activate(navItem);
			} else {
				this.deactivate(navItem);
			}
		}
	}

	activate(navItem) {
		const $item = document.getElementById(`nav-${navItem}`);
		$item.classList.add('active');
	}

	deactivate(navItem) {
		const $item = document.getElementById(`nav-${navItem}`);
		$item.classList.remove('active');
	}
}

module.exports = PreferenceNav;
