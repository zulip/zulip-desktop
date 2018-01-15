const {
  remote: { app, dialog }
} = require('electron');
const path = require('path');

class ImportCertificate extends HTMLElement {
	constructor() {
		super();
		this._certFile = '';
	}

	connectedCallback() {
		if (this.childElementCount === 0) {
			this.innerHTML = `
        <div class="title">Import pkcs12 certificate in to your certificate store.</div>
      `;

			const settingsCard = this.settingsCard;
			this.appendChild(settingsCard);
		}
	}

	importCert(opts) {
		this.loading = true;
		app.importCertificate(opts, status => {
			this.loading = false;
			if (status !== 0) {
				this.errorImporting('Failed to import certificate');
				return;
			}

			this.certImported();
		});
	}

	get settingsCard() {
		const section = document.createElement('section');
		section.classList.add('settings-card');
		section.innerHTML = `
      <div class="setting-row">
        <div class="import-cert-desc">Choose certificate and enter password</div>
      </div>
      <div class="setting-row">
        <input class="setting-input-value" placeholder="Enter Passphrase for certificate">
      </div>
      <div class="setting-row">
        <button class="action import-cert-btn">Select and Import Certificate</button>
        <div class="import-cert-loading">
          <div>Importing Certificate..</div>
        </div>
        <span class="import-cert-status"></span>
      </div>
    `;

		const importCert = section.querySelector('button.import-cert-btn');
		this._importCert = importCert;
		this._password = section.querySelector('input');
		this._loadingIndicator = section.querySelector('div.import-cert-loading');
		this._statusIndicator = section.querySelector('span');

		importCert.addEventListener('click', () => {
			const opts = {
				title: 'Select certificate to import',
				buttonLabel: 'Import Certificate'
			};

			dialog.showOpenDialog(opts, (file = []) => {
				this._certFile = file[0] || '';
				this.validateAndImport();
			});
		});

		return section;
	}

	validateAndImport() {
		const certificate = this._certFile;
		const password = this._password.value;
		const importCert = this._importCert;
		if (certificate !== '' && password !== '') {
			importCert({ certificate, password });
		} else {
			this.errorImporting(`Please, ${password === '' ?
      'enter a password' : 'choose certificate file'}`);
		}
	}

	set loading(status) {
		const button = this._importCert;
		const indicator = this._loadingIndicator;
		if (status) {
			button.classList.add('hide');
			indicator.classList.add('show');
		} else {
			button.classList.remove('hide');
			indicator.classList.remove('show');
		}
	}

	errorImporting(msg) {
		const indicator = this._statusIndicator;
		indicator.classList.add('error');
		indicator.innerHTML = msg;
	}

	certImported() {
		const indicator = this._statusIndicator;
		const cert = path.basename(this._certFile);
		indicator.classList.remove('error');
		indicator.innerHTML = `${cert} was imported successfully`;
	}
}

module.exports = ImportCertificate;
