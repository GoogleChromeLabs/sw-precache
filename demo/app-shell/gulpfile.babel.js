import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import del from 'del';
import express from 'express';
import gulp from 'gulp';
import gutil from 'gulp-util';
import nodemon from 'nodemon';
import packageJson from './package.json';
import path from 'path';
import size from 'gulp-size';
import source from 'vinyl-source-stream';
import sequence from 'run-sequence';
import swPrecache from 'sw-precache';
import {spawn} from 'child_process';

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const THIRD_PARTY_MODULES = ['react', 'react-router'];

gulp.task('clean', () => {
  return del(BUILD_DIR);
});

gulp.task('bundle-app', () => {
  const bundler = browserify({
    entries: path.join(SRC_DIR, 'components', 'index.jsx'),
    extensions: ['.jsx'],
    transform: [babelify]
  });
  THIRD_PARTY_MODULES.forEach(module => bundler.external(module));

  return bundler.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .on('error', gutil.log)
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('bundle-third-party', () => {
  const bundler = browserify();
  THIRD_PARTY_MODULES.forEach(module => bundler.require(module));

  return bundler.bundle()
    .pipe(source('third-party.js'))
    .pipe(buffer())
    .on('error', gutil.log)
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('copy-static', () => {
  return gulp.src(`${SRC_DIR}/static/**/*`)
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('generate-service-worker', () => {
  const serviceWorkerFile = path.join(BUILD_DIR, 'service-worker.js');
  return del(serviceWorkerFile).then(() => {
    return swPrecache.write(serviceWorkerFile, {
      cacheId: packageJson.name,
      directoryIndex: null,
      dynamicUrlToDependencies: {
        '/shell': [`${SRC_DIR}/views/index.handlebars`]
      },
      logger: gutil.log,
      navigateFallback: '/shell',
      staticFileGlobs: [`${BUILD_DIR}/**/*.js`],
      stripPrefix: 'build/',
      verbose: true
    });
  });
});

gulp.task('build', callback => {
  sequence(
    ['bundle-app', 'bundle-third-party', 'copy-static'],
    'generate-service-worker',
    callback
  );
});

gulp.task('serve', callback => {
  nodemon({
    script: 'index.js',
    ext: 'js jsx html',
    watch: [SRC_DIR, BUILD_DIR],
    verbose: true
  }).on('start', () => {
    gutil.log('Server started.');
  }).on('restart', files => {
    gutil.log('Restarted server. Changed files: ', files);
  }).on('quit', callback);
});

gulp.task('watch', callback => {
  gulp.watch(`${SRC_DIR}/**/*.jsx`, ['bundle-app']);
  gulp.watch(`${SRC_DIR}/static/**/*`, ['copy-static']);
});

gulp.task('default', callback => {
  sequence('clean', 'build', ['serve', 'watch'], callback);
});
