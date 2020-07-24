import {remote, OpenDialogOptions} from 'electron';
import path from 'path';

import BaseComponent from '../../components/base';
import * as CertificateUtil from '../../utils/certificate-util';
import * as DomainUtil from '../../utils/domain-util';
import * as t from '../../utils/translation-util';

interface AddCertificateProps {
	$root: Element;
}

const {dialog} = remote;

export default class AddCertificate extends BaseComponent {
	props: AddCertificateProps;
	_certFile: string;
	$addCertificate: Element | null;
	addCertificateButton: Element | null;
	serverUrl: HTMLInputElement | null;
	constructor(props: AddCertificateProps) {
		super();
		this.props = props;
		this._certFile = '';
	}

	template(): string {
		return `
			<div class="settings-card certificates-card">
				<div class="certificate-input">
					<div>${t.__('Organization URL')}</div>
					<input class="setting-input-value" autofocus placeholder="your-organization.zulipchat.com or zulip.your-organization.com"/>
				</div>
				<div class="certificate-input">
					<div>${t.__('Certificate file')}</div>
					<button class="green" id="add-certificate-button">${t.__('Upload')}</button>
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

	async validateAndAdd(): Promise<void> {
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
			this.serverUrl.value = '';
			await dialog.showMessageBox({
				title: 'Success',
				message: 'Certificate saved!'
			});
		} else {
			dialog.showErrorBox('Error', `Please, ${serverUrl === '' ?
				'Enter an Organization URL' : 'Choose certificate file'}`);
		}
	}

	async addHandler(): Promise<void> {
		const showDialogOptions: OpenDialogOptions = {
			title: 'Select file',
			properties: ['openFile'],
			filters: [{name: 'crt, pem', extensions: ['crt', 'pem']}]
		};
		const {filePaths, canceled} = await dialog.showOpenDialog(showDialogOptions);
		if (!canceled) {
			this._certFile = filePaths[0] || '';
			await this.validateAndAdd();
		}
	}

	initListeners(): void {
		this.addCertificateButton.addEventListener('click', async () => {
			await this.addHandler();
		});

		this.serverUrl.addEventListener('keypress', async event => {
			if (event.key === 'Enter') {
				await this.addHandler();
			}
		});
	}
}
