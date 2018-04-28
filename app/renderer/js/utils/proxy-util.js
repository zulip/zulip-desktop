'use strict';

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

	resolveSystemProxy(mainWindow) {
		const page = mainWindow.webContents;
		const ses = page.session;
		const resolveProxyUrl = 'chat.zulip.org';

		let proxyString = '';

		// Check HTTP Proxy
		ses.resolveProxy('http://' + resolveProxyUrl, proxy => {
			if (proxy !== 'DIRECT') {
				// in case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
				// for all other HTTP or direct url:port both uses PROXY
				if (proxy.includes('PROXY') || proxy.includes('HTTPS')) {
					proxyString += 'http=' + proxy.split('PROXY')[1] + ';';
				}
			}
		});
		// Check HTTPS Proxy
		ses.resolveProxy('https://' + resolveProxyUrl, proxy => {
			if (proxy !== 'DIRECT' || proxy.includes('HTTPS')) {
				// in case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
				// for all other HTTP or direct url:port both uses PROXY
				if (proxy.includes('PROXY' || proxy.includes('HTTPS'))) {
					proxyString += 'https=' + proxy.split('PROXY')[1] + ';';
				}
			}
		});

		// Check FTP Proxy
		ses.resolveProxy('ftp://' + resolveProxyUrl, proxy => {
			if (proxy !== 'DIRECT') {
				if (proxy.includes('PROXY')) {
					proxyString += 'ftp=' + proxy.split('PROXY')[1] + ';';
				}
			}
		});

		// Check SOCKS Proxy
		ses.resolveProxy('socks4://' + resolveProxyUrl, proxy => {
			if (proxy !== 'DIRECT') {
				if (proxy.includes('SOCKS5')) {
					proxyString += 'socks=' + proxy.split('SOCKS5')[1] + ';';
				} else if (proxy.includes('SOCKS4')) {
					proxyString += 'socks=' + proxy.split('SOCKS4')[1] + ';';
				}
			}
			// proxyString is written here so that empty string is not written as resolveProxy is async
			ConfigUtil.setConfigItem('systemProxyRules', proxyString);
		});
	}
}

module.exports = new ProxyUtil();
