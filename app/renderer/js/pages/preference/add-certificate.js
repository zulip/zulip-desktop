'use-strict';

const { dialog } = require('electron').remote;

const BaseComponent = require(__dirname + '/../../components/base.js');
const CertificateUtil = require(__dirname + '/../../utils/certificate-util.js');
const DomainUtil = require(__dirname + '/../../utils/domain-util.js');

class AddCertificate extends BaseComponent {
	constructor(props) {
		super();
		this.props = props;
		this._certFile = '';
	}

	template() {
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

	init() {
		this.$addCertificate = this.generateNodeFromTemplate(this.template());
		this.props.$root.appendChild(this.$addCertificate);
		this.addCertificateButton = this.$addCertificate.querySelector('#add-certificate-button');
		this.serverUrl = this.$addCertificate.querySelectorAll('input.setting-input-value')[0];
		this.initListeners();
	}

	validateAndAdd() {
		const certificate = this._certFile;
		const serverUrl = this.serverUrl.value;
		if (certificate !== '' && serverUrl !== '') {
			const server = encodeURIComponent(DomainUtil.formatUrl(serverUrl));
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
			const fileName = path.basename(certificate);
=======
			const fileName = certificate.substring(certificate.lastIndexOf(path.sep) + 1);
>>>>>>> 31da113... certificate: Use path.sep for path separator to support Windows.
=======
			const fileName = path.basename(certificate);
>>>>>>> 9bdc5dd... certificate: Use path.basename to get certificate file name.
=======
			const fileName = path.basename(certificate);
>>>>>>> upstream/master
=======
			const fileName = certificate.substring(certificate.lastIndexOf('/') + 1);
>>>>>>> parent of dd1ce9c... Changed saveServerIcon() to not use request() on defaultIconUrl
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

	addHandler() {
		const showDialogOptions = {
			title: 'Select file',
			defaultId: 1,
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

	initListeners() {
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

module.exports = AddCertificate;
