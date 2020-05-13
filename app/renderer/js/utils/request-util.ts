import {remote} from 'electron';

import fs from 'fs';
import path from 'path';
import * as ConfigUtil from './config-util';
import Logger from './logger-util';
import * as ProxyUtil from './proxy-util';
import * as CertificateUtil from './certificate-util';
import * as SystemUtil from './system-util';

const {app} = remote;

const logger = new Logger({
	file: 'request-util.log',
	timestamp: true
});

interface RequestUtilResponse {
	ca: string;
	proxy: string | void | ProxyUtil.ProxyRule;
	ecdhCurve: 'auto';
	headers: { 'User-Agent': string };
}

export function requestOptions(domain: string): RequestUtilResponse {
	domain = formatUrl(domain);
	const certificate = CertificateUtil.getCertificate(
		encodeURIComponent(domain)
	);

	let certificateFile = null;
	if (certificate?.includes('/')) {
		// Certificate saved using old app version
		certificateFile = certificate;
	} else if (certificate) {
		certificateFile = path.join(`${app.getPath('userData')}/certificates`, certificate);
	}

	let certificateLocation = '';
	if (certificate) {
		// To handle case where certificate has been moved from the location in certificates.json
		try {
			certificateLocation = fs.readFileSync(certificateFile, 'utf8');
		} catch (error) {
			logger.warn('Error while trying to get certificate:', error);
		}
	}

	const proxyEnabled = ConfigUtil.getConfigItem('useManualProxy') || ConfigUtil.getConfigItem('useSystemProxy');
	// If certificate for the domain exists add it as a ca key in the request's parameter else consider only domain as the parameter for request
	// Add proxy as a parameter if it is being used.
	return {
		ca: certificateLocation ? certificateLocation : '',
		proxy: proxyEnabled ? ProxyUtil.getProxy(domain) : '',
		ecdhCurve: 'auto',
		headers: {'User-Agent': SystemUtil.getUserAgent()}
	};
}

function formatUrl(domain: string): string {
	const hasPrefix = domain.startsWith('http', 0);
	if (hasPrefix) {
		return domain;
	}

	return domain.includes('localhost:') ? `http://${domain}` : `https://${domain}`;
}
