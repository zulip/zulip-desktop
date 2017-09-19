'use strict';

const BaseComponent = require(__dirname + '/../../components/base.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');

class NewServerForm extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="settings-card">
				<div class="server-info-right">
					<div class="server-info-row">
						<input class="setting-input-value" autofocus placeholder="Enter the URL of your Zulip organization..."/>
					</div>
					<div class="server-info-row">
						<div class="action blue server-save-action">
							<i class="material-icons">check_box</i>
							<span>Add</span>
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
		this.$newServerForm = this.generateNodeFromTemplate(this.template());
		this.$saveServerButton = this.$newServerForm.getElementsByClassName('server-save-action')[0];
		this.props.$root.innerHTML = '';
		this.props.$root.appendChild(this.$newServerForm);

		this.$newServerUrl = this.$newServerForm.querySelectorAll('input.setting-input-value')[0];
	}

	submitFormHandler() {
		DomainUtil.checkDomain(this.$newServerUrl.value).then(serverConf => {
			DomainUtil.addDomain(serverConf).then(() => {
				this.props.onChange(this.props.index);
			});
		}, errorMessage => {
			alert(errorMessage);
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
	}
}

module.exports = NewServerForm;
