'use strict';
const gulp = require('gulp');
const electron = require('electron-connect').server.create({
      verbose: true
});

gulp.task('dev', () => {
  // Start browser process
  electron.start();
  // Restart browser process
  gulp.watch('app/main/*.js', ['restart:browser']);
  // for some reason this is not working
  gulp.watch('app/renderer/css/*.css', ['reload:renderer']);
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

gulp.task('default', ['dev']);
