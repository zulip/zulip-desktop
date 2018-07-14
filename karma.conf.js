module.exports = function (config) {
	config.set({
		basepath: '',
		frameworks: ['jasmine'],
		browsers: ['Electron'],
		// Preprocessors is for backfilling `__filename` and local `require` paths
		preprocessors: {
			'**/*.js': ['electron']
		},
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
