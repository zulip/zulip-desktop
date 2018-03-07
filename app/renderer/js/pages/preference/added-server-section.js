'use strict';

const BaseSection = require(__dirname + '/base-section.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');
const ServerInfoForm = require(__dirname + '/server-info-form.js');
const CreateOrganziation = require(__dirname + '/create-new-org.js');

class AddedSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="settings-pane" id="server-settings-pane">
				<div id="new-server-container"></div>
				<div class="title" id="existing-servers"></div>
				<div id="server-info-container"></div>
				<div id="create-organization-container"></div>
			</div>
		`;
	}

	init() {
		this.initServers();
	}

	initServers() {
		this.props.$root.innerHTML = '';

		const servers = DomainUtil.getDomains();
		this.props.$root.innerHTML = this.template();
		this.$serverInfoContainer = document.getElementById('server-info-container');
		this.$existingServers = document.getElementById('existing-servers');

		this.$serverInfoContainer.innerHTML = servers.length ? '' : '';
		// Show Existing servers if servers are there otherwise hide it
		this.$existingServers.innerHTML = servers.length === 0 ? '' : 'Connected organizations';

		this.$createOrganizationContainer = document.getElementById('create-organization-container');
		this.initCreateNewOrganization();

		for (let i = 0; i < servers.length; i++) {
			new ServerInfoForm({
				$root: this.$serverInfoContainer,
				server: servers[i],
				index: i,
				onChange: this.reloadApp
			}).init();
		}
	}

	initCreateNewOrganization() {
		new CreateOrganziation({
			$root: this.$createOrganizationContainer
		}).init();
	}
}

module.exports = AddedSection;
