import {ipcRenderer} from 'electron';

import * as DomainUtil from '../../utils/domain-util';
import * as t from '../../utils/translation-util';

import AddCertificate from './add-certificate';
import BaseSection from './base-section';
import FindAccounts from './find-accounts';
import ServerInfoForm from './server-info-form';

interface ConnectedOrgSectionProps {
	$root: Element;
}

export default class ConnectedOrgSection extends BaseSection {
	props: ConnectedOrgSectionProps;
	$serverInfoContainer: Element | null;
	$existingServers: Element | null;
	$newOrgButton: HTMLButtonElement | null;
	$addCertificateContainer: Element | null;
	$findAccountsContainer: Element | null;
	constructor(props: ConnectedOrgSectionProps) {
		super();
		this.props = props;
	}

	template(): string {
		return `
			<div class="settings-pane" id="server-settings-pane">
				<div class="page-title">${t.__('Connected organizations')}</div>
				<div class="title" id="existing-servers">${t.__('All the connected orgnizations will appear here.')}</div>
				<div id="server-info-container"></div>
				<div id="new-org-button"><button class="green sea w-250">${t.__('Connect to another organization')}</button></div>
				<div class="page-title">${t.__('Add Custom Certificates')}</div>
				<div id="add-certificate-container"></div>
				<div class="page-title">${t.__('Find accounts by email')}</div>
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

		const noServerText = t.__('All the connected orgnizations will appear here');
		// Show noServerText if no servers are there otherwise hide it
		this.$existingServers.innerHTML = servers.length === 0 ? noServerText : '';

		for (const [i, server] of servers.entries()) {
			new ServerInfoForm({
				$root: this.$serverInfoContainer,
				server,
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
