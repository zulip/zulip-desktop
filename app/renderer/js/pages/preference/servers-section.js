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
		<div class="add-server-modal">
			<div class="modal-container">
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
		this.$newServerContainer = document.getElementById('new-server-container');

		this.initNewServerForm();
	}

	initNewServerForm() {
		new NewServerForm({
			$root: this.$newServerContainer,
			onChange: this.reloadApp
		}).init();
	}
}

module.exports = ServersSection;
