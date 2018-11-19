const fs = require('fs');

const Logger = require('./logger-util');

const DomainUtil = require(__dirname + '/domain-util.js');
const CertificateUtil = require(__dirname + '/certificate-util.js');
const ProxyUtil = require(__dirname + '/proxy-util.js');
const ConfigUtil = require(__dirname + '/config-util.js');

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

	requestOptions(domain) {
		domain = DomainUtil.formatUrl(domain);

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

		const proxyEnabled =
			ConfigUtil.getConfigItem('useManualProxy') ||
			ConfigUtil.getConfigItem('useSystemProxy');

		return {
			ca: certificateLocation ? certificateLocation : '',
			proxy: proxyEnabled ? ProxyUtil.getProxy(domain) : '',
			ecdhCurve: 'auto'
		};
	}
}

module.exports = new RequestUtil();
