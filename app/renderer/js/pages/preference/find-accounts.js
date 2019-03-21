'use-strict';

const { ipcRenderer } = require('electron');

const BaseComponent = require(__dirname + '/../../components/base.js');

class FindAccounts extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	init() {
		this.$findAccountsButton = document.querySelector('#find-accounts-container').children[0];
		this.initListener();
	}

	findAccounts() {
		ipcRenderer.send('find-accounts', 'https://zulipchat.com/accounts/find');
	}

	initListener() {
		this.$findAccountsButton.addEventListener('click', () => {
			this.findAccounts();
		});
	}
}

module.exports = FindAccounts;
