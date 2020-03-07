import BaseComponent from '../../components/base';
import * as t from '../../utils/translation-util';

interface PreferenceNavProps {
	$root: Element;
	onItemSelected: (navItem: string) => void;
}

export default class PreferenceNav extends BaseComponent {
	props: PreferenceNavProps;
	navItems: string[];
	$el: Element;
	constructor(props: PreferenceNavProps) {
		super();
		this.props = props;
		this.navItems = ['General', 'Network', 'AddServer', 'Organizations', 'Shortcuts'];
		this.init();
	}

	template(): string {
		let navItemsTemplate = '';
		for (const navItem of this.navItems) {
			navItemsTemplate += `<div class="nav" id="nav-${navItem}">${t.__(navItem)}</div>`;
		}

		return `
			<div>
				<div id="settings-header">${t.__('Settings')}</div>
				<div id="nav-container">${navItemsTemplate}</div>
			</div>
		`;
	}

	init(): void {
		this.$el = this.generateNodeFromTemplate(this.template());
		this.props.$root.append(this.$el);
		this.registerListeners();
	}

	registerListeners(): void {
		for (const navItem of this.navItems) {
			const $item = document.querySelector(`#nav-${navItem}`);
			$item.addEventListener('click', () => {
				this.props.onItemSelected(navItem);
			});
		}
	}

	select(navItemToSelect: string): void {
		for (const navItem of this.navItems) {
			if (navItem === navItemToSelect) {
				this.activate(navItem);
			} else {
				this.deactivate(navItem);
			}
		}
	}

	activate(navItem: string): void {
		const $item = document.querySelector(`#nav-${navItem}`);
		$item.classList.add('active');
	}

	deactivate(navItem: string): void {
		const $item = document.querySelector(`#nav-${navItem}`);
		$item.classList.remove('active');
	}
}
