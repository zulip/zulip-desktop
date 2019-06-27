'use-strict';

import { remote, OpenDialogOptions } from 'electron';

import path = require('path');
import BaseComponent = require('../../components/base');
import CertificateUtil = require('../../utils/certificate-util');
import DomainUtil = require('../../utils/domain-util');

const { dialog } = remote;

class AddCertificate extends BaseComponent {
	// TODO: TypeScript - Here props should be object type
	props: any;
	_certFile: string;
	$addCertificate: Element | null;
	addCertificateButton: Element | null;
	serverUrl: HTMLInputElement | null;
	constructor(props: any) {
		super();
		this.props = props;
		this._certFile = '';
	}

	template(): string {
		return `
			<div class="settings-card certificates-card">
				<div class="certificate-input">
					<div>Organization URL</div>
					<input class="setting-input-value" autofocus placeholder="your-organization.zulipchat.com or zulip.your-organization.com"/>
				</div>
				<div class="certificate-input">
					<div>Certificate file</div>
					<button class="green" id="add-certificate-button">Upload</button>
				</div>
			</div>
		`;
	}

	init(): void {
		this.$addCertificate = this.generateNodeFromTemplate(this.template());
		this.props.$root.append(this.$addCertificate);
		this.addCertificateButton = this.$addCertificate.querySelector('#add-certificate-button');
		this.serverUrl = this.$addCertificate.querySelectorAll('input.setting-input-value')[0] as HTMLInputElement;
		this.initListeners();
	}

	validateAndAdd(): void {
		const certificate = this._certFile;
		const serverUrl = this.serverUrl.value;
		if (certificate !== '' && serverUrl !== '') {
			const server = encodeURIComponent(DomainUtil.formatUrl(serverUrl));
			const fileName = path.basename(certificate);
			const copy = CertificateUtil.copyCertificate(server, certificate, fileName);
			if (!copy) {
				return;
			}
			CertificateUtil.setCertificate(server, fileName);
			dialog.showMessageBox({
				title: 'Success',
				message: `Certificate saved!`
			});
			this.serverUrl.value = '';
		} else {
			dialog.showErrorBox('Error', `Please, ${serverUrl === '' ?
				'Enter an Organization URL' : 'Choose certificate file'}`);
		}
	}

	addHandler(): void {
		const showDialogOptions: OpenDialogOptions = {
			title: 'Select file',
			properties: ['openFile'],
			filters: [{ name: 'crt, pem', extensions: ['crt', 'pem'] }]
		};
		dialog.showOpenDialog(showDialogOptions, selectedFile => {
			if (selectedFile) {
				this._certFile = selectedFile[0] || '';
				this.validateAndAdd();
			}
		});
	}

	initListeners(): void {
		this.addCertificateButton.addEventListener('click', () => {
			this.addHandler();
		});

		this.serverUrl.addEventListener('keypress', event => {
			const EnterkeyCode = event.keyCode;

			if (EnterkeyCode === 13) {
				this.addHandler();
			}
		});
	}
}

export = AddCertificate;
