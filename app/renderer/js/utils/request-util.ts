import * as fs from 'fs';
import Logger from './logger-util';

import ProxyUtil from './proxy-util';
import ConfigUtil from './config-util';

import CertificateUtil = require('./certificate-util');
import SystemUtil = require('./system-util');

const logger = new Logger({
	file: `request-util.log`,
	timestamp: true
});

let instance: null | RequestUtil = null;

interface RequestUtilResponse {
	ca: string;
	proxy: string;
	ecdhCurve: 'auto';
	headers: { 'User-Agent': string };
	rejectUnauthorized: boolean;
}

class RequestUtil {
	constructor() {
		if (!instance) {
			instance = this;
		}

		return instance;
	}

	// ignoreCerts parameter helps in fetching server icon and
	// other server details when user chooses to ignore certificate warnings
	requestOptions(domain: string, ignoreCerts: boolean): RequestUtilResponse {
		domain = this.formatUrl(domain);
		const certificate = CertificateUtil.getCertificate(
			encodeURIComponent(domain)
		);
		let certificateLocation = '';
		if (certificate) {
			// To handle case where certificate has been moved from the location in certificates.json
			try {
				certificateLocation = fs.readFileSync(certificate, 'utf8');
			} catch (err) {
				logger.warn(`Error while trying to get certificate: ${err}`);
			}
		}
		const proxyEnabled = ConfigUtil.getConfigItem('useManualProxy') || ConfigUtil.getConfigItem('useSystemProxy');
		// If certificate for the domain exists add it as a ca key in the request's parameter else consider only domain as the parameter for request
		// Add proxy as a parameter if it is being used.
		return {
			ca: certificateLocation ? certificateLocation : '',
			proxy: proxyEnabled ? ProxyUtil.getProxy(domain) : '',
			ecdhCurve: 'auto',
			headers: { 'User-Agent': SystemUtil.getUserAgent() },
			rejectUnauthorized: !ignoreCerts
		};
	}

	formatUrl(domain: string): string {
		const hasPrefix = domain.startsWith('http', 0);
		if (hasPrefix) {
			return domain;
		} else {
			return domain.includes('localhost:') ? `http://${domain}` : `https://${domain}`;
		}
	}
}

const requestUtil = new RequestUtil();
export = requestUtil;
