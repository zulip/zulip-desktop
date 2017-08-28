'use strict';
const { ipcRenderer } = require('electron');

const BaseSection = require(__dirname + '/base-section.js');
const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

class GeneralSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
            <div class="settings-pane">
                <div class="title">Appearance</div>
                <div id="appearance-option-settings" class="settings-card">
					<div class="setting-row" id="tray-option">
						<div class="setting-description">Show app icon in system tray</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="sidebar-option">
						<div class="setting-description">Show sidebar (<span class="code">CmdOrCtrl+S</span>)</div>
						<div class="setting-control"></div>
					</div>
					<div class="setting-row" id="badge-option">
					<div class="setting-description">Show app unread badge</div>
					<div class="setting-control"></div>
				</div>
				</div>
				<div class="title">Desktop Notification</div>
                <div class="settings-card">
					<div class="setting-row" id="silent-option">
						<div class="setting-description">Mute all sounds from Zulip (requires reload)</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">App Updates</div>
                <div class="settings-card">
					<div class="setting-row" id="betaupdate-option">
						<div class="setting-description">Get beta updates</div>
						<div class="setting-control"></div>
					</div>
				</div>
				<div class="title">Functionality</div>
                <div class="settings-card">
					<div class="setting-row" id="startAtLogin-option">
						<div class="setting-description">Start app at login</div>
						<div class="setting-control"></div>
					</div>
				</div>
            </div>
		`;
	}

	init() {
		this.props.$root.innerHTML = this.template();
		this.updateTrayOption();
		this.updateBadgeOption();
		this.updateUpdateOption();
		this.updateSilentOption();
		this.updateSidebarOption();
		this.updateStartAtLoginOption();
	}

	updateTrayOption() {
		this.generateSettingOption({
			$element: document.querySelector('#tray-option .setting-control'),
			value: ConfigUtil.getConfigItem('trayIcon', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('trayIcon');
				ConfigUtil.setConfigItem('trayIcon', newValue);
				ipcRenderer.send('forward-message', 'toggletray');
				this.updateTrayOption();
			}
		});
	}

	updateBadgeOption() {
		this.generateSettingOption({
			$element: document.querySelector('#badge-option .setting-control'),
			value: ConfigUtil.getConfigItem('badgeOption', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('badgeOption');
				ConfigUtil.setConfigItem('badgeOption', newValue);
				ipcRenderer.send('toggle-badge-option', newValue);
				this.updateBadgeOption();
			}
		});
	}

	updateUpdateOption() {
		this.generateSettingOption({
			$element: document.querySelector('#betaupdate-option .setting-control'),
			value: ConfigUtil.getConfigItem('betaUpdate', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('betaUpdate');
				ConfigUtil.setConfigItem('betaUpdate', newValue);
				this.updateUpdateOption();
			}
		});
	}

	updateSilentOption() {
		this.generateSettingOption({
			$element: document.querySelector('#silent-option .setting-control'),
			value: ConfigUtil.getConfigItem('silent', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('silent', true);
				ConfigUtil.setConfigItem('silent', newValue);
				this.updateSilentOption();
			}
		});
	}

	updateSidebarOption() {
		this.generateSettingOption({
			$element: document.querySelector('#sidebar-option .setting-control'),
			value: ConfigUtil.getConfigItem('showSidebar', true),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('showSidebar');
				ConfigUtil.setConfigItem('showSidebar', newValue);
				ipcRenderer.send('forward-message', 'toggle-sidebar', newValue);
				this.updateSidebarOption();
			}
		});
	}

	updateStartAtLoginOption() {
		this.generateSettingOption({
			$element: document.querySelector('#startAtLogin-option .setting-control'),
			value: ConfigUtil.getConfigItem('startAtLogin', false),
			clickHandler: () => {
				const newValue = !ConfigUtil.getConfigItem('startAtLogin');
				ConfigUtil.setConfigItem('startAtLogin', newValue);
				this.updateStartAtLoginOption();
			}
		});
	}

}

module.exports = GeneralSection;
