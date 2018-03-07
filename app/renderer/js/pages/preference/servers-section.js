'use strict';

const BaseSection = require(__dirname + '/base-section.js');
const NewServerForm = require(__dirname + '/new-server-form.js');

class ServersSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
		<div id="myModal" class="modal">
		<div class="modal-content">

			<div class="settings-pane" id="server-settings-pane">
				<div class="page-title">Add a Zulip organization</div>
				<div id="new-server-container"></div>
			</div>

			</div>
			</div>
		`;
	}

	init() {
		this.initServers();
	}

	initServers() {
		this.props.$root.innerHTML = '';

		this.props.$root.innerHTML = this.template();
		this.$serverInfoContainer = document.getElementById('server-info-container');
		this.$existingServers = document.getElementById('existing-servers');
		this.$newServerContainer = document.getElementById('new-server-container');
		this.$newServerButton = document.getElementById('new-server-action');

		this.initNewServerForm();

		this.$createOrganizationContainer = document.getElementById('create-organization-container');


	}

	initNewServerForm() {
		new NewServerForm({
			$root: this.$newServerContainer,
			onChange: this.reloadApp
		}).init();
	}
}

module.exports = ServersSection;
