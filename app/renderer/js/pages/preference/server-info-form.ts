'use strict';

import { remote, ipcRenderer } from 'electron';

import BaseComponent = require('../../components/base');
import DomainUtil = require('../../utils/domain-util');

const { dialog } = remote;

class ServerInfoForm extends BaseComponent {
	// TODO: TypeScript - Here props should be object type
	props: any;
	$serverInfoForm: Element;
	$serverInfoAlias: Element;
	$serverIcon: Element;
	$deleteServerButton: Element;
	$openServerButton: Element;
	constructor(props: any) {
		super();
		this.props = props;
	}

	template(): string {
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
						<div class="action red server-delete-action">
							<span>Disconnect</span>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	init(): void {
		this.initForm();
		this.initActions();
	}

	initForm(): void {
		this.$serverInfoForm = this.generateNodeFromTemplate(this.template());
		this.$serverInfoAlias = this.$serverInfoForm.querySelectorAll('.server-info-alias')[0];
		this.$serverIcon = this.$serverInfoForm.querySelectorAll('.server-info-icon')[0];
		this.$deleteServerButton = this.$serverInfoForm.querySelectorAll('.server-delete-action')[0];
		this.$openServerButton = this.$serverInfoForm.querySelectorAll('.open-tab-button')[0];
		this.props.$root.append(this.$serverInfoForm);
	}

	initActions(): void {
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

export = ServerInfoForm;
