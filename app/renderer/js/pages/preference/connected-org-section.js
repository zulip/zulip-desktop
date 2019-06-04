'use strict';

const BaseSection = require(__dirname + '/base-section.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');
const ServerInfoForm = require(__dirname + '/server-info-form.js');
const AddCertificate = require(__dirname + '/add-certificate.js');
const FindAccounts = require(__dirname + '/find-accounts.js');

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
				<div id="new-org-button"><button class="green sea w-250">Connect to another organization</button></div>
				<div class="page-title">Add Custom Certificates</div>
				<div id="add-certificate-container"></div>
				<div class="page-title">Find accounts by email</div>
				<div id="find-accounts-container"></div>
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
		this.$newOrgButton = document.getElementById('new-org-button');
		this.$addCertificateContainer = document.getElementById('add-certificate-container');
		this.$findAccountsContainer = document.getElementById('find-accounts-container');

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

		this.$newOrgButton.addEventListener('click', () => {
			// We don't need to import this since it's already imported in other files
			// eslint-disable-next-line no-undef
			ipcRenderer.send('forward-message', 'open-org-tab');
		});

		this.initAddCertificate();
		this.initFindAccounts();
	}

	initAddCertificate() {
		new AddCertificate({
			$root: this.$addCertificateContainer
		}).init();
	}

	initFindAccounts() {
		new FindAccounts({
			$root: this.$findAccountsContainer
		}).init();
	}
}

module.exports = ConnectedOrgSection;
