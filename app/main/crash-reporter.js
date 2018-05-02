'use strict';

const { crashReporter } = require('electron');

const crashHandler = () => {
	crashReporter.start({
		productName: 'zulip-electron',
		companyName: 'Kandra Labs, Inc.',
		submitURL: 'https://zulip-sentry.herokuapp.com/crashreport',
		uploadToServer: true
	});
};

module.exports = {
	crashHandler
};
