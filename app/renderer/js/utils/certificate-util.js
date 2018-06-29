'use strict';

const { app, dialog } = require('electron').remote;
const fs = require('fs');
const path = require('path');
const JsonDB = require('node-json-db');
const Logger = require('./logger-util');
const { initSetUp } = require('./default-util');

initSetUp();

const logger = new Logger({
	file: `certificate-util.log`,
	timestamp: true
});

let instance = null;
const certificatesDir = `${app.getPath('userData')}/certificates`;

class CertificateUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		return instance;
	}
	getCertificate(server, defaultValue = null) {
		this.reloadDB();
		const value = this.db.getData('/')[server];
		if (value === undefined) {
			return defaultValue;
		} else {
			return value;
		}
	}
	// Function to copy the certificate to userData folder
	copyCertificate(server, location, fileName) {
		let copied = false;
		const filePath = `${certificatesDir}/${fileName}`;
		try {
			fs.copyFileSync(location, filePath);
			copied = true;
		} catch (err) {
			dialog.showErrorBox(
				'Error saving certificate',
				'We encountered error while saving the certificate.'
			);
			logger.error('Error while copying the certificate to certificates folder.');
			logger.error(err);
		}
		return copied;
	}
	setCertificate(server, fileName) {
		const filePath = `${certificatesDir}/${fileName}`;
		this.db.push(`/${server}`, filePath, true);
		this.reloadDB();
	}
	removeCertificate(server) {
		this.db.delete(`/${server}`);
		this.reloadDB();
	}
	reloadDB() {
		const settingsJsonPath = path.join(app.getPath('userData'), '/config/certificates.json');
		try {
			const file = fs.readFileSync(settingsJsonPath, 'utf8');
			JSON.parse(file);
		} catch (err) {
			if (fs.existsSync(settingsJsonPath)) {
				fs.unlinkSync(settingsJsonPath);
				dialog.showErrorBox(
					'Error saving settings',
					'We encountered error while saving the certificate.'
				);
				logger.error('Error while JSON parsing certificates.json: ');
				logger.error(err);
			}
		}
		this.db = new JsonDB(settingsJsonPath, true, true);
	}
}

module.exports = new CertificateUtil();
