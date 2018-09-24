const { init, captureException } = require('@sentry/electron');
const isDev = require('electron-is-dev');

const sentryInit = () => {
	if (!isDev) {
		init({
			dsn: 'SENTRY_DSN',
			// We should ignore this error since it's harmless and we know the reason behind this
			// This error mainly comes from the console logs.
			// This is a temp solution until Sentry supports disabling the console logs
			ignoreErrors: ['does not appear to be a valid Zulip server'],
			sendTimeout: 30 // wait 30 seconds before considering the sending capture to have failed, default is 1 second
		});
	}
};

module.exports = {
	sentryInit,
	captureException
};
