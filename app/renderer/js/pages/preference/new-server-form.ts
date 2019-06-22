'use strict';

import { shell } from 'electron';

import BaseComponent = require('../../components/base');
import DomainUtil = require('../../utils/domain-util');

class NewServerForm extends BaseComponent {
	// TODO: TypeScript - Here props should be object type
	props: any;
	$newServerForm: Element;
	$saveServerButton: HTMLButtonElement;
	$newServerUrl: HTMLInputElement;
	constructor(props: any) {
		super();
		this.props = props;
	}

	template(): string {
		return `
			<div class="server-input-container">
				<div class="title">Organization URL</div>
				<div class="add-server-info-row">
					<input class="setting-input-value" autofocus placeholder="your-organization.zulipchat.com or zulip.your-organization.com"/>
				</div>
				<div class="server-center">
					<div class="server-save-action">
						<button id="connect">Connect</button>
					</div>
				</div>
				<div class="server-center">
				<div class="divider">
					<hr class="left"/>OR<hr class="right" />
				</div>
				</div>
				<div class="server-center">
				<div class="server-save-action">
					<button id="open-create-org-link">Create a new organization</button>
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
		this.$newServerForm = this.generateNodeFromTemplate(this.template());
		this.$saveServerButton = this.$newServerForm.querySelectorAll('.server-save-action')[0] as HTMLButtonElement;
		this.props.$root.innerHTML = '';
		this.props.$root.append(this.$newServerForm);
		this.$newServerUrl = this.$newServerForm.querySelectorAll('input.setting-input-value')[0] as HTMLInputElement;
	}

	submitFormHandler(): void {
		this.$saveServerButton.children[0].innerHTML = 'Connecting...';
		DomainUtil.checkDomain(this.$newServerUrl.value).then(serverConf => {
			DomainUtil.addDomain(serverConf).then(() => {
				this.props.onChange(this.props.index);
			});
		}, errorMessage => {
			this.$saveServerButton.children[0].innerHTML = 'Connect';
			alert(errorMessage);
		});
	}

	openCreateNewOrgExternalLink(): void {
		const link = 'https://zulipchat.com/new/';
		const externalCreateNewOrgEl = document.querySelector('#open-create-org-link');
		externalCreateNewOrgEl.addEventListener('click', () => {
			shell.openExternal(link);
		});
	}

	initActions(): void {
		this.$saveServerButton.addEventListener('click', () => {
			this.submitFormHandler();
		});
		this.$newServerUrl.addEventListener('keypress', event => {
			const EnterkeyCode = event.keyCode;
			// Submit form when Enter key is pressed
			if (EnterkeyCode === 13) {
				this.submitFormHandler();
			}
		});
		// open create new org link in default browser
		this.openCreateNewOrgExternalLink();
	}
}

export = NewServerForm;
