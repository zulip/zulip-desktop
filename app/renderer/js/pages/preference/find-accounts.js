'use-strict';

const { dialog } = require('electron').remote;
const path = require('path');

const BaseComponent = require(__dirname + '/../../components/base.js');

class FindAccounts extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="settings-card find-accounts-card">
				<div class="email-input">
					<div>Email address(es)</div>
					<input class="setting-input-value" autofocus placeholder="Add up to 10 comma-separated email addresses"/>
				</div>
				<div class="email-input">
					<button class="green sea w-150" id="find-accounts-button">Find accounts</button>
				</div>
			</div>
		`;
	}

	confirmation() {
		return `
			<div class="sub-title">
				<div>Emails sent! You will only receive emails at addresses associated with Zulip organizations.</div>
			</div>
		`;
	}

	init() {
		this.$findAccounts = this.generateNodeFromTemplate(this.template());
		this.$confirmation = this.generateNodeFromTemplate(this.confirmation());
		this.props.$root.appendChild(this.$findAccounts);
		this.findAccountsButton = this.$findAccounts.querySelector('#add-accounts-button');
		this.emailList = this.$findAccounts.querySelectorAll('input.setting-input-value')[0];
		this.initListeners();
	}

	findAccounts() {
		// TODO: Write business logic to find accounts
	}

	initListeners() {
		this.findAccountsButton.addEventListener('click', () => {
			this.findAccounts();
		});

		this.emailList.addEventListener('keypress', event => {
			const EnterkeyCode = event.keyCode;

			if (EnterkeyCode === 13) {
				this.findAccounts();
			}
		});
	}
}

module.exports = FindAccounts;
