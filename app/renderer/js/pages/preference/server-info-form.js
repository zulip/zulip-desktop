'use strict';
const {dialog} = require('electron').remote;

const BaseComponent = require(__dirname + '/../../components/base.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');

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
				</div>
				<div class="server-info-right">
					<div class="server-info-row">
						<span class="server-info-key">Name</span>
						<input class="server-info-value" disabled value="${this.props.server.alias}"/>
					</div>
					<div class="server-info-row">
						<span class="server-info-key">Url</span>
						<input class="server-info-value" disabled value="${this.props.server.url}"/>
					</div>
					<div class="server-info-row">
						<span class="server-info-key">Icon</span>
						<input class="server-info-value" disabled value="${this.props.server.icon}"/>
					</div>
					<div class="server-info-row">
						<span class="server-info-key"></span>
						<div class="action red server-delete-action">
							<i class="material-icons">indeterminate_check_box</i>
							<span>Delete</span>
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
		this.$deleteServerButton = this.$serverInfoForm.getElementsByClassName('server-delete-action')[0];
		this.props.$root.appendChild(this.$serverInfoForm);
	}

	initActions() {
		this.$deleteServerButton.addEventListener('click', () => {
			dialog.showMessageBox({
				type: 'warning',
				buttons: ['YES', 'NO'],
				defaultId: 0,
				message: 'Are you sure you want to delete this server?'
			}, response => {
				if (response === 0) {
					DomainUtil.removeDomain(this.props.index);
					this.props.onChange(this.props.index);
				}
			});
		});
	}
}

module.exports = ServerInfoForm;
