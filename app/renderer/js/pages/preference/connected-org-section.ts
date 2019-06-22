'use strict';

import { ipcRenderer } from 'electron';

import BaseSection = require('./base-section');
import DomainUtil = require('../../utils/domain-util');
import ServerInfoForm = require('./server-info-form');
import AddCertificate = require('./add-certificate');
import FindAccounts = require('./find-accounts');

class ConnectedOrgSection extends BaseSection {
	// TODO: TypeScript - Here props should be object type
	props: any;
	$serverInfoContainer: Element | null;
	$existingServers: Element | null;
	$newOrgButton: HTMLButtonElement | null;
	$addCertificateContainer: Element | null;
	$findAccountsContainer: Element | null;
	constructor(props: any) {
		super();
		this.props = props;
	}

	template(): string {
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

	init(): void {
		this.initServers();
	}

	initServers(): void {
		this.props.$root.innerHTML = '';

		const servers = DomainUtil.getDomains();
		this.props.$root.innerHTML = this.template();

		this.$serverInfoContainer = document.querySelector('#server-info-container');
		this.$existingServers = document.querySelector('#existing-servers');
		this.$newOrgButton = document.querySelector('#new-org-button');
		this.$addCertificateContainer = document.querySelector('#add-certificate-container');
		this.$findAccountsContainer = document.querySelector('#find-accounts-container');

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
			ipcRenderer.send('forward-message', 'open-org-tab');
		});

		this.initAddCertificate();
		this.initFindAccounts();
	}

	initAddCertificate(): void {
		new AddCertificate({
			$root: this.$addCertificateContainer
		}).init();
	}

	initFindAccounts(): void {
		new FindAccounts({
			$root: this.$findAccountsContainer
		}).init();
	}
}

export = ConnectedOrgSection;
