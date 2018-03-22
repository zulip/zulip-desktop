'use strict';

const BaseComponent = require(__dirname + '/../../components/base.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');
const shell = require('electron').shell;

class NewServerForm extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
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

	init() {
		this.initForm();
		this.initActions();
	}

	initForm() {
		this.$newServerForm = this.generateNodeFromTemplate(this.template());
		this.$saveServerButton = this.$newServerForm.getElementsByClassName('server-save-action')[0];
		this.props.$root.innerHTML = '';
		this.props.$root.appendChild(this.$newServerForm);

		this.$newServerUrl = this.$newServerForm.querySelectorAll('input.setting-input-value')[0];
	}

	submitFormHandler() {
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

	openCreateNewOrgExternalLink() {
		const link = 'https://zulipchat.com/new/';
		const externalCreateNewOrgEl = document.getElementById('open-create-org-link');
		externalCreateNewOrgEl.addEventListener('click', () => {
			shell.openExternal(link);
		});
	}

	initActions() {
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

module.exports = NewServerForm;
