'use-strict';

const { shell } = require('electron');

const BaseComponent = require(__dirname + '/../../components/base.js');

class FindAccounts extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="settings-card certificate-card">
				<div class="certificate-input">
					<div>Organization URL</div>
					<input class="setting-input-value" value="zulipchat.com"/>
				</div>
				<div class="certificate-input">
					<button class="green w-150" id="find-accounts-button">Find accounts</button>
				</div>
			</div>
		`;
	}

	init() {
		this.$findAccounts = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$findAccounts);
		this.$findAccountsButton = this.$findAccounts.querySelector('#find-accounts-button');
		this.$serverUrlField = this.$findAccounts.querySelectorAll('input.setting-input-value')[0];
		this.initListeners();
	}

	findAccounts(url) {
		if (!url) {
			return;
		}
		if (!url.startsWith('http')) {
			url = 'https://' + url;
		}
		shell.openExternal(url + '/accounts/find');
	}

	initListeners() {
		this.$findAccountsButton.addEventListener('click', () => {
			this.findAccounts(this.$serverUrlField.value);
		});

		this.$serverUrlField.addEventListener('click', () => {
			if (this.$serverUrlField.value === 'zulipchat.com') {
				this.$serverUrlField.setSelectionRange(0, 0);
			}
		});

		this.$serverUrlField.addEventListener('keypress', event => {
			if (event.keyCode === 13) {
				this.findAccounts(this.$serverUrlField.value);
			}
		});

		this.$serverUrlField.addEventListener('input', () => {
			if (this.$serverUrlField.value) {
				this.$serverUrlField.classList.remove('invalid-input-value');
			} else {
				this.$serverUrlField.classList.add('invalid-input-value');
			}
		});
	}
}

module.exports = FindAccounts;
