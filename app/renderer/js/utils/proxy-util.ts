import * as ConfigUtil from './config-util';

export interface ProxyRule {
	hostname?: string;
	port?: number;
}

// TODO: Refactor to async function
export async function resolveSystemProxy(mainWindow: Electron.BrowserWindow): Promise<void> {
	const page = mainWindow.webContents;
	const ses = page.session;
	const resolveProxyUrl = 'www.example.com';

	// Check HTTP Proxy
	const httpProxy = (async () => {
		const proxy = await ses.resolveProxy('http://' + resolveProxyUrl);
		let httpString = '';
		if (proxy !== 'DIRECT' && (proxy.includes('PROXY') || proxy.includes('HTTPS'))) {
			// In case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
			// for all other HTTP or direct url:port both uses PROXY
			httpString = 'http=' + proxy.split('PROXY')[1] + ';';
		}

		return httpString;
	})();
	// Check HTTPS Proxy
	const httpsProxy = (async () => {
		const proxy = await ses.resolveProxy('https://' + resolveProxyUrl);
		let httpsString = '';
		if ((proxy !== 'DIRECT' || proxy.includes('HTTPS')) && (proxy.includes('PROXY') || proxy.includes('HTTPS'))) {
			// In case of proxy HTTPS url:port, windows gives first word as HTTPS while linux gives PROXY
			// for all other HTTP or direct url:port both uses PROXY
			httpsString += 'https=' + proxy.split('PROXY')[1] + ';';
		}

		return httpsString;
	})();

	// Check FTP Proxy
	const ftpProxy = (async () => {
		const proxy = await ses.resolveProxy('ftp://' + resolveProxyUrl);
		let ftpString = '';
		if (proxy !== 'DIRECT' && proxy.includes('PROXY')) {
			ftpString += 'ftp=' + proxy.split('PROXY')[1] + ';';
		}

		return ftpString;
	})();

	// Check SOCKS Proxy
	const socksProxy = (async () => {
		const proxy = await ses.resolveProxy('socks4://' + resolveProxyUrl);
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

		return socksString;
	})();

	const values = await Promise.all([httpProxy, httpsProxy, ftpProxy, socksProxy]);
	let proxyString = '';
	values.forEach(proxy => {
		proxyString += proxy;
	});
	ConfigUtil.setConfigItem('systemProxyRules', proxyString);
	const useSystemProxy = ConfigUtil.getConfigItem('useSystemProxy');
	if (useSystemProxy) {
		ConfigUtil.setConfigItem('proxyRules', proxyString);
	}
}
