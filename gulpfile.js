'use strict';
const gulp = require('gulp');
const electron = require('electron-connect').server.create({
	verbose: true
});
const tape = require('gulp-tape');
const tapColorize = require('tap-colorize');

gulp.task('dev', () => {
  // Start browser process
	electron.start();
  // Restart browser process
	gulp.watch('app/main/*.js', ['restart:browser']);
  // Reload renderer process
	gulp.watch('app/renderer/css/*.css', ['reload:renderer']);
	gulp.watch('app/renderer/*.html', ['reload:renderer']);
	gulp.watch('app/renderer/js/**/*.js', ['reload:renderer']);
});

gulp.task('restart:browser', done => {
	electron.stop();
	electron.restart();
	done();
});

gulp.task('reload:renderer', done => {
  // Reload renderer process
	electron.reload();
	done();
});

gulp.task('test-e2e', () => {
	return gulp.src('tests/*.js')
	.pipe(tape({
		reporter: tapColorize()
	}));
});

gulp.task('default', ['dev', 'test-e2e']);
