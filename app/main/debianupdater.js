const { app } = require('electron');
const { Notification } = require('electron');

const request = require('request');
const semver = require('semver');
const ConfigUtil = require('../renderer/js/utils/config-util');

function debianUpdateNotification() {
	let url = '';

	if (ConfigUtil.getConfigItem('betaUpdate')) {
		url = 'https://api.github.com/repos/zulip/zulip-electron/releases';
	} else {
		url = 'https://api.github.com/repos/zulip/zulip-electron/releases/latest';
	}
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
			let latestVersion = '';
			if (ConfigUtil.getConfigItem('betaUpdate')) {
				latestVersion = data[0].tag_name;
			} else {
				latestVersion = data.tag_name;
			}
			if (semver.gt(latestVersion, app.getVersion())) {
				new Notification({title: 'Zulip Update', body: 'A new version ' + latestVersion + ' is available. Please update using your package manager.'}).show();
			}
		} else {
			console.log('Status:', response.statusCode);
		}
	});
}

module.exports = {
	debianUpdateNotification
};
