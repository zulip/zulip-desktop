'use strict';

const {ipcRenderer} = require('electron');

const BaseComponent = require(__dirname + '/../../components/base.js');
const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

class GeneralSection extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
            <div class="settings-pane" id="server-settings-pane">
                <div class="title">Tray Options</div>
                <div id="tray-option-settings" class="settings-card">
					<div class="setting-row">
						<div class="setting-description">Show app icon in system tray</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">App updates</div>
                <div id="betaupdate-option-settings" class="settings-card">
					<div class="setting-row">
						<div class="setting-description">Get Beta updates</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">Desktop Notification</div>
                <div id="silent-option-settings" class="settings-card">
					<div class="setting-row">
						<div class="setting-description">Mute all sounds from Zulip (requires reload)</div>
						<div class="setting-control"></div>
					</div>
				</div>
            </div>
		`;
	}

	settingsOptionTemplate(settingOption) {
		if (settingOption) {
			return `
				<div class="action green">
					<span>On</span>
				</div>
			`;
		} else {
			return `
				<div class="action red">
					<span>Off</span>
				</div>
			`;
		}
	}

	trayOptionTemplate(trayOption) {
		this.settingsOptionTemplate(trayOption);
	}

	updateOptionTemplate(updateOption) {
		this.settingsOptionTemplate(updateOption);
	}

	silentOptionTemplate(silentOption) {
		this.settingsOptionTemplate(silentOption);
	}

	init() {
		this.props.$root.innerHTML = this.template();
		this.initTrayOption();
		this.initUpdateOption();
		this.initSilentOption();
	}

	initTrayOption() {
		this.$trayOptionSettings = document.querySelector('#tray-option-settings .setting-control');
		this.$trayOptionSettings.innerHTML = '';

		const trayOption = ConfigUtil.getConfigItem('trayIcon', true);
		const $trayOption = this.generateNodeFromTemplate(this.settingsOptionTemplate(trayOption));
		this.$trayOptionSettings.appendChild($trayOption);

		$trayOption.addEventListener('click', () => {
			const newValue = !ConfigUtil.getConfigItem('trayIcon');
			ConfigUtil.setConfigItem('trayIcon', newValue);
			ipcRenderer.send('forward-message', 'toggletray');
			this.initTrayOption();
		});
	}

	initUpdateOption() {
		this.$updateOptionSettings = document.querySelector('#betaupdate-option-settings .setting-control');
		this.$updateOptionSettings.innerHTML = '';

		const updateOption = ConfigUtil.getConfigItem('betaUpdate', false);
		const $updateOption = this.generateNodeFromTemplate(this.settingsOptionTemplate(updateOption));
		this.$updateOptionSettings.appendChild($updateOption);

		$updateOption.addEventListener('click', () => {
			const newValue = !ConfigUtil.getConfigItem('betaUpdate');
			ConfigUtil.setConfigItem('betaUpdate', newValue);
			this.initUpdateOption();
		});
	}

	initSilentOption() {
		this.$silentOptionSettings = document.querySelector('#silent-option-settings .setting-control');
		this.$silentOptionSettings.innerHTML = '';

		const silentOption = ConfigUtil.getConfigItem('silent', false);
		const $silentOption = this.generateNodeFromTemplate(this.settingsOptionTemplate(silentOption));
		this.$silentOptionSettings.appendChild($silentOption);

		$silentOption.addEventListener('click', () => {
			const newValue = !ConfigUtil.getConfigItem('silent');
			ConfigUtil.setConfigItem('silent', newValue);
			this.initSilentOption();
		});
	}
	handleServerInfoChange() {
		ipcRenderer.send('reload-main');
	}
}

module.exports = GeneralSection;
