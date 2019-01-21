'use strict';
const { dialog } = require('electron').remote;
const { ipcRenderer } = require('electron');

const BaseComponent = require(__dirname + '/../../components/base.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');
const ConfigUtil = require(__dirname + '/../../utils/config-util.js');

class ServerInfoForm extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="settings-card">
				<div class="server-info-left">
					<img class="server-info-icon" src="${this.props.server.icon}"/>
					<div class="server-info-row">
						<span class="server-info-alias">${this.props.server.alias}</span>
						<i class="material-icons open-tab-button">open_in_new</i>
					</div>
				</div>
				<div class="server-info-right">
					<div class="server-info-row server-url">
						<span class="server-url-info" title="${this.props.server.url}">${this.props.server.url}</span>
					</div>
					<div class="server-info-row">
						<div class="action gray server-mute-notifications">
						<span>${this.props.muteText}</span>
					</div>
					<div class="server-info-row">
						<div class="action red server-delete-action">
							<span>Disconnect</span>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	init() {
		this.initForm();
		this.initActions();
	}

	initForm() {
		this.$serverInfoForm = this.generateNodeFromTemplate(this.template());
		this.$serverInfoAlias = this.$serverInfoForm.getElementsByClassName('server-info-alias')[0];
		this.$serverIcon = this.$serverInfoForm.getElementsByClassName('server-info-icon')[0];
		this.$deleteServerButton = this.$serverInfoForm.getElementsByClassName('server-delete-action')[0];
		this.$openServerButton = this.$serverInfoForm.getElementsByClassName('open-tab-button')[0];
		this.$muteServerButton = this.$serverInfoForm.getElementsByClassName('server-mute-notifications')[0];
		this.props.$root.appendChild(this.$serverInfoForm);
	}

	initActions() {
		this.$deleteServerButton.addEventListener('click', () => {
			dialog.showMessageBox({
				type: 'warning',
				buttons: ['YES', 'NO'],
				defaultId: 0,
				message: 'Are you sure you want to disconnect this organization?'
			}, response => {
				if (response === 0) {
					DomainUtil.removeDomain(this.props.index);
					this.props.onChange(this.props.index);
				}
			});
		});

		this.$muteServerButton.addEventListener('click', () => {
			dialog.showMessageBox({
				type: 'warning',
				buttons: ['YES', 'NO'],
				defaultId: 0,
				message: 'Are you sure you want to ' + this.props.muteText.toLowerCase() + ' this organization?'
			}, response => {
				if (response === 0) {
					const url = this.props.server.url;
					const muteLabel = this.props.$root.children[this.props.index].children[1].children[1].children[0];
					const mutedOrganizations = ConfigUtil.getConfigItem('mutedOrganizations');
					if (mutedOrganizations[url]) {
						muteLabel.innerHTML = 'Mute';
						this.props.muteText = 'Mute';
					} else {
						muteLabel.innerHTML = 'Unmute';
						this.props.muteText = 'Unmute';
					}
					ipcRenderer.send('forward-message', 'mute-org', this.props.index);
				}
			});
		});

		this.$openServerButton.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'switch-server-tab', this.props.index);
		});

		this.$serverInfoAlias.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'switch-server-tab', this.props.index);
		});

		this.$serverIcon.addEventListener('click', () => {
			ipcRenderer.send('forward-message', 'switch-server-tab', this.props.index);
		});
	}

}

module.exports = ServerInfoForm;
