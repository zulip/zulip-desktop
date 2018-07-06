'use strict';

// const { crashReporter } = require('electron');

// Temporarily remove this.
const crashHandler = () => {
// 	crashReporter.start({
// 		productName: 'zulip-electron',
// 		companyName: 'Kandra Labs, Inc.',
// 		submitURL: 'https://zulip-sentry.herokuapp.com/crashreport',
// 		uploadToServer: true
// 	});
};

module.exports = {
	crashHandler
};
