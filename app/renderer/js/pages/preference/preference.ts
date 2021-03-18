import {ipcRenderer} from 'electron';

import type {DNDSettings} from '../../../../common/dnd-util';
import BaseComponent from '../../components/base';

import ConnectedOrgSection from './connected-org-section';
import GeneralSection from './general-section';
import Nav from './nav';
import NetworkSection from './network-section';
import ServersSection from './servers-section';
import ShortcutsSection from './shortcuts-section';

type Section = ServersSection | GeneralSection | NetworkSection | ConnectedOrgSection | ShortcutsSection;

export default class PreferenceView extends BaseComponent {
	$sidebarContainer: Element;
	$settingsContainer: Element;
	nav: Nav;
	section: Section;
	constructor() {
		super();
		this.$sidebarContainer = document.querySelector('#sidebar');
		this.$settingsContainer = document.querySelector('#settings-container');
	}

	init(): void {
		this.nav = new Nav({
			$root: this.$sidebarContainer,
			onItemSelected: this.handleNavigation.bind(this)
		});

		this.setDefaultView();
		this.registerIpcs();
	}

	setDefaultView(): void {
		let nav = 'General';
		const hasTag = window.location.hash;
		if (hasTag) {
			nav = hasTag.slice(1);
		}

		this.handleNavigation(nav);
	}

	handleNavigation(navItem: string): void {
		this.nav.select(navItem);
		switch (navItem) {
			case 'AddServer': {
				this.section = new ServersSection({
					$root: this.$settingsContainer
				});
				break;
			}

			case 'General': {
				this.section = new GeneralSection({
					$root: this.$settingsContainer
				});
				break;
			}

			case 'Organizations': {
				this.section = new ConnectedOrgSection({
					$root: this.$settingsContainer
				});
				break;
			}

			case 'Network': {
				this.section = new NetworkSection({
					$root: this.$settingsContainer
				});
				break;
			}

			case 'Shortcuts': {
				this.section = new ShortcutsSection({
					$root: this.$settingsContainer
				});
				break;
			}

			default: break;
		}

		this.section.init();
		window.location.hash = `#${navItem}`;
	}

	// Handle toggling and reflect changes in preference page
	handleToggle(elementName: string, state: boolean): void {
		const inputSelector = `#${elementName} .action .switch input`;
		const input: HTMLInputElement = document.querySelector(inputSelector);
		if (input) {
			input.checked = state;
		}
	}

	registerIpcs(): void {
		ipcRenderer.on('switch-settings-nav', (_event: Event, navItem: string) => {
			this.handleNavigation(navItem);
		});

		ipcRenderer.on('toggle-sidebar-setting', (_event: Event, state: boolean) => {
			this.handleToggle('sidebar-option', state);
		});

		ipcRenderer.on('toggle-menubar-setting', (_event: Event, state: boolean) => {
			this.handleToggle('menubar-option', state);
		});

		ipcRenderer.on('toggletray', (_event: Event, state: boolean) => {
			this.handleToggle('tray-option', state);
		});

		ipcRenderer.on('toggle-dnd', (_event: Event, _state: boolean, newSettings: DNDSettings) => {
			this.handleToggle('show-notification-option', newSettings.showNotification);
			this.handleToggle('silent-option', newSettings.silent);

			if (process.platform === 'win32') {
				this.handleToggle('flash-taskbar-option', newSettings.flashTaskbarOnMessage);
			}
		});
	}
}

window.addEventListener('load', () => {
	const preferenceView = new PreferenceView();
	preferenceView.init();
});
