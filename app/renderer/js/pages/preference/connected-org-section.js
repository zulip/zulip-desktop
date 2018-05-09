'use strict';

const BaseSection = require(__dirname + '/base-section.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');
const ServerInfoForm = require(__dirname + '/server-info-form.js');
const AddCertificate = require(__dirname + '/add-certificate.js');

class ConnectedOrgSection extends BaseSection {
	constructor(props) {
		super();
		this.props = props;
	}

	template() {
		return `
			<div class="settings-pane" id="server-settings-pane">
				<div class="page-title">Connected organizations</div>
				<div class="title" id="existing-servers">All the connected orgnizations will appear here.</div>
				<div id="server-info-container"></div>

				<div class="page-title">Add Custom Certificates</div>
				<div id="add-certificate-container"></div>
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

		const noServerText = 'All the connected orgnizations will appear here';
		// Show noServerText if no servers are there otherwise hide it
		this.$existingServers.innerHTML = servers.length === 0 ? noServerText : '';

		for (let i = 0; i < servers.length; i++) {
			new ServerInfoForm({
				$root: this.$serverInfoContainer,
				server: servers[i],
				index: i,
				onChange: this.reloadApp
			}).init();
		}

		this.$addCertificateContainer = document.getElementById('add-certificate-container');
		this.initAddCertificate();
	}

	initAddCertificate() {
		new AddCertificate({
			$root: this.$addCertificateContainer
		}).init();
	}

}

module.exports = ConnectedOrgSection;
