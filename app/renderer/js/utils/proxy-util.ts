'use strict';

import url = require('url');

import ConfigUtil = require('./config-util');

let instance: null | ProxyUtil = null;

interface ProxyRule {
	hostname?: string;
	port?: number;
}

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
	getProxy(_uri: string): ProxyRule | void {
		const parsedUri = url.parse(_uri);
		if (parsedUri === null) {
			return;
		}

		const uri = parsedUri;
		const proxyRules = ConfigUtil.getConfigItem('proxyRules', '').split(';');
		// If SPS is on and system uses no proxy then request should not try to use proxy from
		// environment. NO_PROXY = '*' makes request ignore all environment proxy variables.
		if (proxyRules[0] === '') {
			process.env.NO_PROXY = '*';
			return;
		}

		const proxyRule: any = {};
		if (uri.protocol === 'http:') {
			proxyRules.forEach((proxy: string) => {
				if (proxy.includes('http=')) {
					proxyRule.hostname = proxy.split('http=')[1].trim().split(':')[0];
					proxyRule.port = proxy.split('http=')[1].trim().split(':')[1];
				}
			});
			return proxyRule;
		}

		if (uri.protocol === 'https:') {
			proxyRules.forEach((proxy: string) => {
				if (proxy.includes('https=')) {
					proxyRule.hostname = proxy.split('https=')[1].trim().split(':')[0];
					proxyRule.port = proxy.split('https=')[1].trim().split(':')[1];
				}
			});
			return proxyRule;
		}
	}

	// TODO: Refactor to async function
	resolveSystemProxy(mainWindow: Electron.BrowserWindow): void {
		const page = mainWindow.webContents;
		const ses = page.session;
		const resolveProxyUrl = 'www.example.com';

		// Check HTTP Proxy
		const httpProxy = new Promise(resolve => {
			ses.resolveProxy('http://' + resolveProxyUrl, (proxy: string) => {
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
			ses.resolveProxy('https://' + resolveProxyUrl, (proxy: string) => {
				let httpsString = '';
				if (proxy !== 'DIRECT' || proxy.includes('HTTPS')) {
					// in case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
					// for all other HTTP or direct url:port both uses PROXY
					if (proxy.includes('PROXY') || proxy.includes('HTTPS')) {
						httpsString += 'https=' + proxy.split('PROXY')[1] + ';';
					}
				}
				resolve(httpsString);
			});
		});

		// Check FTP Proxy
		const ftpProxy = new Promise(resolve => {
			ses.resolveProxy('ftp://' + resolveProxyUrl, (proxy: string) => {
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
			ses.resolveProxy('socks4://' + resolveProxyUrl, (proxy: string) => {
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

export = new ProxyUtil();
