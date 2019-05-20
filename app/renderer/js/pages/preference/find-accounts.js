'use-strict';

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
	}
}

module.exports = FindAccounts;
