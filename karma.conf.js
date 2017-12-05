module.exports = function(config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine"],
    browsers: ["Electron"],
    preprocessors: {
      '**/*.js': ['electron'],
      'app/renderer/**/*.js': ['coverage']
    },
    files: [
      // './tests/unit/index.js'
      { pattern: "./karma.shim.js", watched: true, included: true, served: true},
      { pattern: "./tests/unit/*.js", watched: true, included: true, served: true },
      { pattern: "./app/renderer/**/*.js", watched: true, included: false, served: true },
    ],
    reporters: ['mocha', 'coverage'],
    client: {
      captureConsole: true,
      useIframe: false
    },
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' },
        { type: 'html' }
      ]
    },
    singleRun: true
  })
}
