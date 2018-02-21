const { app } = require('electron');
const { Notification } = require('electron');

const request = require('request');
const semver = require('semver');
const ConfigUtil = require('../renderer/js/utils/config-util');
const LinuxUpdateUtil = require('../renderer/js/utils/linux-update-util');

function linuxUpdateNotification() {
	let	url = 'https://api.github.com/repos/zulip/zulip-electron/releases';
	url = ConfigUtil.getConfigItem('betaUpdate') ? url : url + '/latest';

	const options = {
		url,
		headers: {'User-Agent': 'request'}
	};

	request(options, (error, response, body) => {
		if (error) {
			console.log('Error:', error);
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
			console.log('Status:', response.statusCode);
		}
	});
}

module.exports = {
	linuxUpdateNotification
};
