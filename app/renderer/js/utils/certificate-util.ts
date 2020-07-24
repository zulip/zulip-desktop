import electron from 'electron';
import fs from 'fs';
import path from 'path';

import {JsonDB} from 'node-json-db';

import {initSetUp} from './default-util';
import Logger from './logger-util';

const {app, dialog} =
	process.type === 'renderer' ? electron.remote : electron;

initSetUp();

const logger = new Logger({
	file: 'certificate-util.log',
	timestamp: true
});

const certificatesDir = `${app.getPath('userData')}/certificates`;

let db: JsonDB;

reloadDB();

export function getCertificate(server: string): string | undefined {
	reloadDB();
	return db.getData('/')[server];
}

// Function to copy the certificate to userData folder
export function copyCertificate(_server: string, location: string, fileName: string): boolean {
	let copied = false;
	const filePath = `${certificatesDir}/${fileName}`;
	try {
		fs.copyFileSync(location, filePath);
		copied = true;
	} catch (error) {
		dialog.showErrorBox(
			'Error saving certificate',
			'We encountered error while saving the certificate.'
		);
		logger.error('Error while copying the certificate to certificates folder.');
		logger.error(error);
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
	} catch (error) {
		if (fs.existsSync(settingsJsonPath)) {
			fs.unlinkSync(settingsJsonPath);
			dialog.showErrorBox(
				'Error saving settings',
				'We encountered error while saving the certificate.'
			);
			logger.error('Error while JSON parsing certificates.json: ');
			logger.error(error);
		}
	}

	db = new JsonDB(settingsJsonPath, true, true);
}
