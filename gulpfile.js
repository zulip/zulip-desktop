'use strict';
const gulp = require('gulp');
const electron = require('electron-connect').server.create({
	verbose: true
});
const tape = require('gulp-tape');
const tapColorize = require('tap-colorize');
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");

const glob = require('glob');
const { execSync } = require('child_process');

const baseFilePattern = 'app/+(main|renderer)/**/*';
const globOptions = { cwd: __dirname };
const jsFiles = glob.sync(baseFilePattern + '.js', globOptions);
const tsFiles = glob.sync(baseFilePattern + '.ts', globOptions);
if (jsFiles.length !== tsFiles.length) {
	const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
	console.log('Compiling typescript files...');
	execSync(`${npx} tsc`);
}

gulp.task("compile", function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("app"));
});

gulp.task('dev', () => {
  // Start browser process
	electron.start();
  // Restart browser process
	gulp.watch('app/main/*.ts', gulp.series('compile', 'restart:browser'));
  // Reload renderer process
	gulp.watch('app/renderer/css/*.css', gulp.series('reload:renderer'));
	gulp.watch('app/renderer/*.html', gulp.series('reload:renderer'));
	gulp.watch('app/renderer/js/**/*.ts', gulp.series('compile', 'reload:renderer'));
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

gulp.task('default', gulp.parallel('dev', 'test-e2e'));
