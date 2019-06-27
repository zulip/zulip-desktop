import { app, Notification } from 'electron';

import request = require('request');
import semver = require('semver');
import ConfigUtil = require('../renderer/js/utils/config-util');
import ProxyUtil = require('../renderer/js/utils/proxy-util');
import LinuxUpdateUtil = require('../renderer/js/utils/linux-update-util');
import Logger = require('../renderer/js/utils/logger-util');

const logger = new Logger({
	file: 'linux-update-util.log',
	timestamp: true
});

export function linuxUpdateNotification(): void {
	let	url = 'https://api.github.com/repos/zulip/zulip-desktop/releases';
	url = ConfigUtil.getConfigItem('betaUpdate') ? url : url + '/latest';
	const proxyEnabled = ConfigUtil.getConfigItem('useManualProxy') || ConfigUtil.getConfigItem('useSystemProxy');

	const options = {
		url,
		headers: {'User-Agent': 'request'},
		proxy: proxyEnabled ? ProxyUtil.getProxy(url) : '',
		ecdhCurve: 'auto'
	};

	request(options, (error: any, response: any, body: any) => {
		if (error) {
			logger.error('Linux update error.');
			logger.error(error);
			return;
		}
		if (response.statusCode < 400) {
			const data = JSON.parse(body);
			const latestVersion = ConfigUtil.getConfigItem('betaUpdate') ? data[0].tag_name : data.tag_name;

			if (semver.gt(latestVersion, app.getVersion())) {
				const notified = LinuxUpdateUtil.getUpdateItem(latestVersion);
				if (notified === null) {
					new Notification({title: 'Zulip Update', body: 'A new version ' + latestVersion + ' is available. Please update using your package manager.'}).show();
					LinuxUpdateUtil.setUpdateItem(latestVersion, true);
				}
			}
		} else {
			logger.log('Linux update response status: ', response.statusCode);
		}
	});
}
