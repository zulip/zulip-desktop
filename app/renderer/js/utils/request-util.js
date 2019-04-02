const fs = require('fs');
const Logger = require('./logger-util');

const CertificateUtil = require(__dirname + '/certificate-util.js');
const ProxyUtil = require(__dirname + '/proxy-util.js');
const ConfigUtil = require(__dirname + '/config-util.js');
const SystemUtil = require(__dirname + '/../utils/system-util.js');

const logger = new Logger({
	file: `request-util.log`,
	timestamp: true
});

let instance = null;

class RequestUtil {
	constructor() {
		if (!instance) {
			instance = this;
		}
		return instance;
	}

	// ignoreCerts parameter helps in fetching server icon and
	// other server details when user chooses to ignore certificate warnings
	requestOptions(domain, ignoreCerts) {
		domain = this.formatUrl(domain);
		const certificate = CertificateUtil.getCertificate(
			encodeURIComponent(domain)
		);
		let certificateLocation = '';
		if (certificate) {
			// To handle case where certificate has been moved from the location in certificates.json
			try {
				certificateLocation = fs.readFileSync(certificate);
			} catch (err) {
				logger.warn('Error while trying to get certificate: ' + err);
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

	formatUrl(domain) {
		const hasPrefix = (domain.indexOf('http') === 0);
		if (hasPrefix) {
			return domain;
		} else {
			return (domain.indexOf('localhost:') >= 0) ? `http://${domain}` : `https://${domain}`;
		}
	}
}

module.exports = new RequestUtil();
