'use strict';

const url = require('url');
const ConfigUtil = require('./config-util.js');

let instance = null;

class ProxyUtil {
	constructor() {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		return instance;
	}

	// Return proxy to be used for a particular uri, to be used for request
	getProxy(uri) {
		uri = url.parse(uri);
		const proxyRules = ConfigUtil.getConfigItem('proxyRules', '').split(';');
		// If SPS is on and system uses no proxy then request should not try to use proxy from
		// environment. NO_PROXY = '*' makes request ignore all environment proxy variables.
		if (proxyRules[0] === '') {
			process.env.NO_PROXY = '*';
			return;
		}

		const proxyRule = {};
		if (uri.protocol === 'http:') {
			proxyRules.forEach(proxy => {
				if (proxy.includes('http=')) {
					proxyRule.hostname = proxy.split('http=')[1].trim().split(':')[0];
					proxyRule.port = proxy.split('http=')[1].trim().split(':')[1];
				}
			});
			return proxyRule;
		}

		if (uri.protocol === 'https:') {
			proxyRules.forEach(proxy => {
				if (proxy.includes('https=')) {
					proxyRule.hostname = proxy.split('https=')[1].trim().split(':')[0];
					proxyRule.port = proxy.split('https=')[1].trim().split(':')[1];
				}
			});
			return proxyRule;
		}
	}

	resolveSystemProxy(mainWindow) {
		const page = mainWindow.webContents;
		const ses = page.session;
		const resolveProxyUrl = 'www.example.com';

		// Check HTTP Proxy
		const httpProxy = new Promise(resolve => {
			ses.resolveProxy('http://' + resolveProxyUrl, proxy => {
				let httpString = '';
				if (proxy !== 'DIRECT') {
					// in case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
					// for all other HTTP or direct url:port both uses PROXY
					if (proxy.includes('PROXY') || proxy.includes('HTTPS')) {
						httpString = 'http=' + proxy.split('PROXY')[1] + ';';
					}
				}
				resolve(httpString);
			});
		});
		// Check HTTPS Proxy
		const httpsProxy = new Promise(resolve => {
			ses.resolveProxy('https://' + resolveProxyUrl, proxy => {
				let httpsString = '';
				if (proxy !== 'DIRECT' || proxy.includes('HTTPS')) {
					// in case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
					// for all other HTTP or direct url:port both uses PROXY
					if (proxy.includes('PROXY' || proxy.includes('HTTPS'))) {
						httpsString += 'https=' + proxy.split('PROXY')[1] + ';';
					}
				}
				resolve(httpsString);
			});
		});

		// Check FTP Proxy
		const ftpProxy = new Promise(resolve => {
			ses.resolveProxy('ftp://' + resolveProxyUrl, proxy => {
				let ftpString = '';
				if (proxy !== 'DIRECT') {
					if (proxy.includes('PROXY')) {
						ftpString += 'ftp=' + proxy.split('PROXY')[1] + ';';
					}
				}
				resolve(ftpString);
			});
		});

		// Check SOCKS Proxy
		const socksProxy = new Promise(resolve => {
			ses.resolveProxy('socks4://' + resolveProxyUrl, proxy => {
				let socksString = '';
				if (proxy !== 'DIRECT') {
					if (proxy.includes('SOCKS5')) {
						socksString += 'socks=' + proxy.split('SOCKS5')[1] + ';';
					} else if (proxy.includes('SOCKS4')) {
						socksString += 'socks=' + proxy.split('SOCKS4')[1] + ';';
					} else if (proxy.includes('PROXY')) {
						socksString += 'socks=' + proxy.split('PROXY')[1] + ';';
					}
				}
				resolve(socksString);
			});
		});

		Promise.all([httpProxy, httpsProxy, ftpProxy, socksProxy]).then(values => {
			let proxyString = '';
			values.forEach(proxy => {
				proxyString += proxy;
			});
			ConfigUtil.setConfigItem('systemProxyRules', proxyString);
			const useSystemProxy = ConfigUtil.getConfigItem('useSystemProxy');
			if (useSystemProxy) {
				ConfigUtil.setConfigItem('proxyRules', proxyString);
			}
		});
	}
}

module.exports = new ProxyUtil();
