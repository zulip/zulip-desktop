'use strict';
const {execSync} = require('child_process');

const electron = require('electron-connect').server.create({
	verbose: true
});
const glob = require('glob');
const gulp = require('gulp');
const tape = require('gulp-tape');
const ts = require('gulp-typescript');
const tapColorize = require('tap-colorize');

const tsProject = ts.createProject('tsconfig.json');
const baseFilePattern = 'app/+(main|renderer)/**/*';
const globOptions = {cwd: __dirname};
const jsFiles = glob.sync(baseFilePattern + '.js', globOptions);
const tsFiles = glob.sync(baseFilePattern + '.ts', globOptions);
if (jsFiles.length !== tsFiles.length) {
	const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
	console.log('Compiling typescript files...');
	execSync(`${npx} tsc`);
}

gulp.task('compile', () => tsProject.src()
	.pipe(tsProject())
	.js.pipe(gulp.dest('app')));

gulp.task('dev', () => {
	// Start browser process
	electron.start(['--electron-connect']);
	// Restart browser process
	gulp.watch('app/main/*.ts', gulp.series('compile', 'restart:browser'));
	// Reload renderer process
	gulp.watch('app/renderer/css/*.css', gulp.series('reload:renderer'));
	gulp.watch('app/renderer/*.html', gulp.series('reload:renderer'));
	gulp.watch('app/renderer/js/**/*.ts', gulp.series('compile', 'reload:renderer'));
});

gulp.task('restart:browser', done => {
	electron.stop();
	electron.restart(['--electron-connect']);
	done();
});

gulp.task('reload:renderer', done => {
	// Reload renderer process
	electron.reload();
	done();
});

gulp.task('test-e2e', () => gulp.src('tests/*.js')
	.pipe(tape({
		reporter: tapColorize()
	})));

gulp.task('default', gulp.parallel('dev', 'test-e2e'));
