'use strict';

const BaseSection = require(__dirname + '/base-section.js');
const NewServerForm = require(__dirname + '/new-server-form.js');
const CreateOrganziation = require(__dirname + '/create-new-org.js');

class ServersSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
		<div class="add-server-modal">
		<div class="modal-container">
			<div class="settings-pane" id="server-settings-pane">
				<div class="page-title">Add a new Zulip organization</div>
				<div id="new-server-container"></div>
				<div id="create-organization-container"></div>
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
		this.$newServerContainer = document.getElementById('new-server-container');
		this.$newServerButton = document.getElementById('new-server-action');
		this.$createOrganizationContainer = document.getElementById('create-organization-container');

		this.initNewServerForm();
		this.initCreateNewOrganization();
	}

	initNewServerForm() {
		new NewServerForm({
			$root: this.$newServerContainer,
			onChange: this.reloadApp
		}).init();
	}

	initCreateNewOrganization() {
		new CreateOrganziation({
			$root: this.$createOrganizationContainer
		}).init();
	}
}

module.exports = ServersSection;
