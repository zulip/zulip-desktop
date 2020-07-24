import {init} from '@sentry/electron';
import isDev from 'electron-is-dev';

export const sentryInit = (): void => {
	if (!isDev) {
		init({
			dsn: 'https://628dc2f2864243a08ead72e63f94c7b1@sentry.io/204668',
			// We should ignore this error since it's harmless and we know the reason behind this
			// This error mainly comes from the console logs.
			// This is a temp solution until Sentry supports disabling the console logs
			ignoreErrors: ['does not appear to be a valid Zulip server']
			/// sendTimeout: 30 // wait 30 seconds before considering the sending capture to have failed, default is 1 second
		});
	}
};

export {captureException} from '@sentry/electron';
