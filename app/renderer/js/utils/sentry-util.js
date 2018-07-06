const { init, captureException } = require('@sentry/electron');
const isDev = require('electron-is-dev');

const sentryInit = () => {
	if (!isDev) {
		init({
			dsn: 'SENTRY_DSN',
			sendTimeout: 30 // wait 30 seconds before considering the sending capture to have failed, default is 1 second
		});
	}
};

module.exports = {
	sentryInit,
	captureException
};
