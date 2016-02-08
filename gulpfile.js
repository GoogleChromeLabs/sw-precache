/* eslint-env node */
'use strict';

var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var runSequence = require('run-sequence');
var spawn = require('child_process').spawn;

gulp.task('default', ['test', 'lint']);

gulp.task('generate-demo-service-worker', function(callback) {
  spawn('gulp', ['--cwd', 'demo', 'generate-service-worker-dev'],
    {stdio: 'inherit'}).on('close', callback);
});

gulp.task('lint', ['generate-demo-service-worker'], function() {
  return gulp.src(['./**/*.js'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

gulp.task('test', function() {
  return gulp.src('test/*.js', {read: false})
    .pipe($.mocha())
    .on('error', function(error) {
      console.error(error);
      process.exit(1);
    });
});

gulp.task('update-markdown-toc', function(callback) {
  // doctoc only exposes a binary in node_modules/.bin/doctoc, without a
  // corresponding API. To make starting this up a little bit nicer, there's a
  // npm script defined in package.json, which let's us use
  // 'npm run doctoc <file.md>'
  spawn('npm', ['run', 'doctoc', '--', 'GettingStarted.md', 'README.md'],
    {stdio: 'inherit'}).on('close', callback);
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
