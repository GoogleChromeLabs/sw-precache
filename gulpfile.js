'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var spawn = require('child_process').spawn;

gulp.task('default', ['test']);

gulp.task('test', function() {
  return gulp.src('test/*.js', {read: false})
    .pipe($.mocha())
    .on('error', function(error) {
      console.error(error);
      process.exit()
    });
});

gulp.task('publish', ['test'], function(callback) {
  spawn('npm', ['publish'], {stdio: 'inherit'})
    .on('close', callback);
});

gulp.task('gh-pages', function(callback) {
  spawn('gulp', ['--cwd', 'demo', 'gh-pages'], {stdio: 'inherit'})
    .on('close', callback);
});

gulp.task('release', function(callback) {
  runSequence('publish', 'gh-pages', callback);
});
