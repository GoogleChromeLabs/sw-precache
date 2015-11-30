/* eslint-env node */
'use strict';

var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var runSequence = require('run-sequence');
var spawn = require('child_process').spawn;

gulp.task('default', ['test', 'lint']);

gulp.task('generate-demo-service-worker', function(callback) {
  spawn('gulp', ['--cwd', 'demo', 'generate-service-worker-dev'], {stdio: 'inherit'})
    .on('close', callback);
});

gulp.task('lint', ['generate-demo-service-worker'], function() {
  return gulp.src(['{lib,demo}/**/*.js', '*.js'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

gulp.task('test', function() {
  return gulp.src('test/*.js', {read: false})
    .pipe($.mocha())
    .on('error', function(error) {
      console.error(error);
      // process.exit(1);
      throw error;
    });
});

gulp.task('publish', ['test', 'lint'], function(callback) {
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
