import { pki } from 'node-forge';

import fs from 'fs';
import Logger from './logger-util';

import { paths } from '../../../../tools/linux-cert-stores.json';

const logger = new Logger({
	file: 'linux-ca-util.log',
	timestamp: true
});

const splitPattern = /(?=-----BEGIN\sCERTIFICATE-----)/g;

if (process.platform !== 'linux') {
	module.exports.all = (format: number): string[] => [];
}

let certs: string[] = [];

for (const path of paths) {
	try {
		const file: string = fs.readFileSync(path, { encoding: 'utf-8' });
		certs = file.split(splitPattern);
		break;
	} catch (err) {
		logger.error(err);
	}
}

module.exports.all = (format: number): string[] => {
	// assuming required format is PEM
	return certs.map(pem => pki.certificateFromPem(pem));
};
