module.exports = function (config) {
	config.set({
		basePath: '',
		frameworks: ['jasmine'],
		browsers: ['Electron'],
		preprocessors: {
			'**/*.js': ['electron']
		},
		files: [
			{pattern: './karma.shim.js', watched: true, included: true, served: true},
			{pattern: './tests/unit/*.js', watched: true, included: true, served: true},
			{pattern: './app/renderer/**/*.js', watched: true, included: false, served: true}
		],
		reporters: ['mocha'],
		client: {
			captureConsole: true,
			useIframe: false
		},
		singleRun: true
	});
};
