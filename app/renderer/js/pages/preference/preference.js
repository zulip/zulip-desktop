'use strict';

const BaseComponent = require(__dirname + '/js/components/base.js');
const {ipcRenderer} = require('electron');

const Nav = require(__dirname + '/js/pages/preference/nav.js');
const ServersSection = require(__dirname + '/js/pages/preference/servers-section.js');
const GeneralSection = require(__dirname + '/js/pages/preference/general-section.js');
const NetworkSection = require(__dirname + '/js/pages/preference/network-section.js');
const ShortcutsSection = require(__dirname + '/js/pages/preference/shortcuts-section.js');

class PreferenceView extends BaseComponent {
	constructor() {
		super();

		this.$sidebarContainer = document.getElementById('sidebar');
		this.$settingsContainer = document.getElementById('settings-container');
	}

	init() {
		this.nav = new Nav({
			$root: this.$sidebarContainer,
			onItemSelected: this.handleNavigation.bind(this)
		});

		this.setDefaultView();
		this.registerIpcs();
	}

	setDefaultView() {
		let nav = 'General';
		const hasTag = window.location.hash;
		if (hasTag) {
			nav = hasTag.substring(1);
		}
		this.handleNavigation(nav);
	}

	handleNavigation(navItem) {
		this.nav.select(navItem);
		switch (navItem) {
			case 'Servers': {
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

	registerIpcs() {
		ipcRenderer.on('switch-settings-nav', (event, navItem) => {
			this.handleNavigation(navItem);
		});
	}
}

window.onload = () => {
	const preferenceView = new PreferenceView();
	preferenceView.init();
};
