'use strict';

import { remote } from 'electron';
import { JsonDB } from 'node-json-db';
import { pki } from 'node-forge';
import { initSetUp } from './default-util';

import fs from 'fs';
import path from 'path';
import Logger from './logger-util';

let ca: any = null;
if (process.platform === 'darwin') {
	ca = require('mac-ca');
} else if (process.platform === 'win32') {
	ca = require('win-ca');
} else {
	ca = require('./linux-ca');
}

const { app, dialog } = remote;

initSetUp();

const logger = new Logger({
	file: 'certificate-util.log',
	timestamp: true
});

const certificatesDir = `${app.getPath('userData')}/certificates`;

let db: JsonDB;

reloadDB();

function matchPemToDomain(domain: string, pem: string): boolean {
	try {
		const cert = pki.certificateFromPem(pem);
		const subject = cert.subject.attributes.map((attribute: any) => [attribute.shortName, attribute.value].join('=')).join(', ');
		if (subject.includes(domain)) {
			return true;
		}
	} catch (err) {
		console.error(err);
	}
	return false;
}

export function checkSystemCertificate(domain: string): string {
	let res = null;
	if (process.platform === 'win32') {
		ca({
			format: ca.der2.pem,
			ondata: (pem: any) => {
				try {
					const cert = pki.certificateFromPem(pem);
					const subject = cert.subject.attributes.map((attribute: any) => [attribute.shortName, attribute.value].join('=')).join(', ');
					if (subject.includes(domain)) {
						res = pem;
						return;
					}
				} catch (err) {
					console.error(err);
				}
			}
		});
	} else {
		// custom linux-ca module matches mac-ca's methods
		for (const pem of ca.all(ca.der2.pem)) {
			if (matchPemToDomain(domain, pem)) {
				res = pem;
				return res;
			}
		}
	}
	return res;
}

export function getCertificate(server: string, defaultValue: any = null): any {
	reloadDB();
	const value = db.getData('/')[server];
	if (value === undefined) {
		return defaultValue;
	} else {
		return value;
	}
}

// Function to copy the certificate to userData folder
export function copyCertificate(_server: string, location: string, fileName: string): boolean {
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

export function setCertificate(server: string, fileName: string): void {
	const filePath = `${fileName}`;
	db.push(`/${server}`, filePath, true);
	reloadDB();
}

export function removeCertificate(server: string): void {
	db.delete(`/${server}`);
	reloadDB();
}

function reloadDB(): void {
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
	db = new JsonDB(settingsJsonPath, true, true);
}
