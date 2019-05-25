module.exports = function (config) {
	config.set({
		basepath: '',
		frameworks: ['mocha'],
		browsers: ['Electron'],
		// Preprocessors is for backfilling `__filename` and local `require` paths
		preprocessors: {
			'**/*.js': ['electron']
		},
		// For showing test success count on travis
		// https://github.com/karma-runner/karma/issues/1344#issuecomment-122660661
		reporters: process.env.KARMA_REPORTER ? [process.env.KARMA_REPORTER] : ['progress'],
		files: [
			{pattern: './karma.shim.js', watched: true, included: true, served: true},
			{pattern: './tests/unit/*.js', watched: true, included: true, served: true},
			{pattern: './app/renderer/**/*.js', watched: true, included: false, served: true}
		],
		client: {
			useIframe: false,
			captureConsole: true
		},
		singleRun: true
	});
};
