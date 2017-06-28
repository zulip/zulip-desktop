'use strict';

const {ipcRenderer} = require('electron');
const BaseComponent = require(__dirname + '/js/components/base.js');


const Nav = require(__dirname + '/js/pages/preference/nav.js');
const ServersSection = require(__dirname + '/js/pages/preference/servers-section.js');
const GeneralSection = require(__dirname + '/js/pages/preference/general-section.js');

class PreferenceView {
	constructor() {
		this.$sidebarContainer = document.getElementById('sidebar');
		this.$settingsContainer = document.getElementById('settings-container');
	}

	init() {
		this.nav = new Nav({
			$root: this.$sidebarContainer,
			onItemSelected: this.handleNavigation.bind(this)
		});
		this.handleNavigation('General');
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
		}
		this.section.init();		
	}
}

window.onload = () => {
	const preferenceView = new PreferenceView();
	preferenceView.init();
};
