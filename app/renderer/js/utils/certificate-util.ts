'use strict';

import { remote } from 'electron';
import JsonDB from 'node-json-db';
import { initSetUp } from './default-util';

import fs = require('fs');
import path = require('path');
import Logger = require('./logger-util');

const { app, dialog } = remote;

initSetUp();

const logger = new Logger({
	file: `certificate-util.log`,
	timestamp: true
});

let instance: null | CertificateUtil = null;
const certificatesDir = `${app.getPath('userData')}/certificates`;

class CertificateUtil {
	db: JsonDB;

	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.reloadDB();
		return instance;
	}

	getCertificate(server: string, defaultValue: any = null): any {
		this.reloadDB();
		const value = this.db.getData('/')[server];
		if (value === undefined) {
			return defaultValue;
		} else {
			return value;
		}
	}

	// Function to copy the certificate to userData folder
	copyCertificate(_server: string, location: string, fileName: string): boolean {
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

	setCertificate(server: string, fileName: string): void {
		const filePath = `${certificatesDir}/${fileName}`;
		this.db.push(`/${server}`, filePath, true);
		this.reloadDB();
	}

	removeCertificate(server: string): void {
		this.db.delete(`/${server}`);
		this.reloadDB();
	}

	reloadDB(): void {
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

export = new CertificateUtil();
