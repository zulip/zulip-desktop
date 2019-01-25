'use-strict';

const request = require('request');

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

	error() {
		return `
			<div class="sub-title">
				<div>Sorry, looks like something went wrong. Try again?</div>
			</div>
		`;
	}

	init() {
		this.$findAccounts = this.generateNodeFromTemplate(this.template());
		this.$confirmation = this.generateNodeFromTemplate(this.confirmation());
		this.$error = this.generateNodeFromTemplate(this.error());
		this.props.$root.appendChild(this.$findAccounts);
		this.findAccountsButton = this.$findAccounts.querySelector('#find-accounts-button');
		this.emailList = this.$findAccounts.querySelector('input.setting-input-value');
		this.initListeners();
	}

	findAccounts() {
		const emails = this.emailList.value;
		if (emails && emails !== '') {
			const url = 'https://zulipchat.com/accounts/find?emails=' + emails;
			request({ url }, error => {
				if (error) {
					this.props.$root.appendChild(this.$error);
				} else {
					this.props.$root.appendChild(this.$confirmation);
					this.emailList.value = '';
				}
			});
		}
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
