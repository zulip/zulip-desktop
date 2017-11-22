'use strict';

const BaseComponent = require(__dirname + '/../../components/base.js');
const shell = require('electron').shell;

class CreateOrganziation extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="setting-row">
				<div class="setting-description">
					<span id="open-create-org-link">Or create a new organization on zulipchat.com<i class="material-icons open-tab-button">open_in_new</i></span>
				</div>
				<div class="setting-control"></div>
			</div>
		`;
	}

	init() {
		this.props.$root.innerHTML = this.template();
		this.openCreateNewOrgExternalLink();
	}

	openCreateNewOrgExternalLink() {
		const link = 'https://zulipchat.com/beta/';
		const externalCreateNewOrgEl = document.getElementById('open-create-org-link');
		externalCreateNewOrgEl.addEventListener('click', () => {
			shell.openExternal(link);
		});
	}
}

module.exports = CreateOrganziation;
