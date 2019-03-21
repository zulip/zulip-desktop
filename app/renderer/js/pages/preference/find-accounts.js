'use-strict';

const { ipcRenderer } = require('electron');

const BaseComponent = require(__dirname + '/../../components/base.js');

class FindAccounts extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
		<div>
			<button class="green sea w-150" id="find-accounts-button">Find accounts</button>
		</div>
		`;
	}

	init() {
		this.$findAccounts = this.generateNodeFromTemplate(this.template());
		console.log(this.$findAccounts);
		this.props.$root.appendChild(this.$findAccounts);
		this.findAccountsButton = this.$findAccounts.querySelector('#find-accounts-button');
		this.initListener();
	}

	findAccounts() {
		ipcRenderer.send('find-accounts', 'https://zulipchat.com/accounts/find');
	}

	initListener() {
		this.findAccountsButton.addEventListener('click', () => {
			this.findAccounts();
		});
	}
}

module.exports = FindAccounts;
