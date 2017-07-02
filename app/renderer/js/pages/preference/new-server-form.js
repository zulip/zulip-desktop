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
			<div class="settings-card" style="border: solid 1px #4CAF50;">
				<div class="server-info-left">
					<img class="server-info-icon" src="${__dirname + '../../../../img/icon.png'}"/>
				</div>
				<div class="server-info-right">
					<div class="server-info-row">
						<span class="server-info-key">Name</span>
						<input class="server-info-value" placeholder="(Required)"/>
					</div>
					<div class="server-info-row">
						<span class="server-info-key">Url</span>
						<input class="server-info-value" placeholder="(Required)"/>
					</div>
					<div class="server-info-row">
						<span class="server-info-key">Icon</span>
						<input class="server-info-value" placeholder="(Optional)"/>
					</div>
					<div class="server-info-row">
						<span class="server-info-key"></span>
						<div class="action green server-save-action">
							<i class="material-icons">check_box</i>
							<span>Save</span>
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

		this.$newServerAlias = this.$newServerForm.querySelectorAll('input.server-info-value')[0];
		this.$newServerUrl = this.$newServerForm.querySelectorAll('input.server-info-value')[1];
		this.$newServerIcon = this.$newServerForm.querySelectorAll('input.server-info-value')[2];
	}

	initActions() {
		this.$saveServerButton.addEventListener('click', () => {
			DomainUtil.checkDomain(this.$newServerUrl.value).then(domain => {
				const server = {
					alias: this.$newServerAlias.value,
					url: domain,
					icon: this.$newServerIcon.value
				};
				DomainUtil.addDomain(server);

				this.props.onChange(this.props.index);
			}, errorMessage => {
				alert(errorMessage);
			});
		});
	}
}

module.exports = NewServerForm;
