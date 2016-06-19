/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import del from 'del';
import eslint from 'gulp-eslint';
import glob from 'glob';
import gulp from 'gulp';
import gutil from 'gulp-util';
import cleanCSS from 'gulp-clean-css';
import packageJson from './package.json';
import path from 'path';
import rev from 'gulp-rev';
import sass from 'gulp-sass';
import sequence from 'run-sequence';
import source from 'vinyl-source-stream';
import {spawn} from 'child_process';
import swPrecache from 'sw-precache';
import uglify from 'gulp-uglify';

const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const THIRD_PARTY_MODULES = [
  'immutable',
  'isomorphic-fetch',
  'react',
  'react-dom',
  'react-redux',
  'react-router',
  'redux',
  'redux-actions',
  'redux-promise'
];

gulp.task('clean', () => {
  return del(BUILD_DIR);
});

gulp.task('bundle-app', () => {
  let bundler = browserify({
    entries: path.join(SRC_DIR, 'components', 'client.jsx'),
    extensions: ['.jsx'],
    transform: [babelify]
  });

  THIRD_PARTY_MODULES.forEach(module => bundler.external(module));

  return bundler.bundle()
    .on('error', function(error) {
      gutil.log('Babelify error:', error.message);
      this.emit('end');
    })
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('bundle-third-party', () => {
  let bundler = browserify();
  THIRD_PARTY_MODULES.forEach(module => bundler.require(module));

  return bundler.bundle()
    .on('error', function(error) {
      gutil.log('Babelify error:', error.message);
      this.emit('end');
    })
    .pipe(source('third-party.js'))
    .pipe(buffer())
    .on('error', gutil.log)
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('copy-static', () => {
  return gulp.src(`${SRC_DIR}/static/**/*`)
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('sass', () => {
  return gulp.src(`${SRC_DIR}/static/sass/*.scss`)
    .pipe(sass().on('error', sass.logError))
    .pipe(cleanCSS())
    .pipe(gulp.dest(`${BUILD_DIR}/styles`));
});

gulp.task('uglify-js', () => {
  return gulp.src(`${BUILD_DIR}/js/**/*`)
    .pipe(uglify())
    .pipe(gulp.dest(`${BUILD_DIR}/js`));
});

gulp.task('version-assets', () => {
  return gulp.src(`${BUILD_DIR}/*/*`)
    .pipe(rev())
    .pipe(gulp.dest(`${BUILD_DIR}/rev`))
    .pipe(rev.manifest())
    .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('generate-service-worker', () => {
  let serviceWorkerFile = path.join(BUILD_DIR, 'service-worker.js');

  return swPrecache.write(serviceWorkerFile, {
    // Start of interesting bits!

    // Ensure all our static, local assets are cached.
    staticFileGlobs: [
      `${BUILD_DIR}/rev/js/**/*.js`,
      `${BUILD_DIR}/rev/styles/all*.css`,
      `${BUILD_DIR}/images/**/*`
    ],

    // Define the dependencies for the server-rendered /shell URL,
    // so that it's kept up to date.
    dynamicUrlToDependencies: {
      '/shell': [
        ...glob.sync(`${BUILD_DIR}/rev/js/**/*.js`),
        ...glob.sync(`${BUILD_DIR}/rev/styles/all*.css`),
        `${SRC_DIR}/views/index.handlebars`
      ]
    },

    // Brute force server worker routing:
    // Tell the service worker to use /shell for all navigations.
    // E.g. A request for /guides/12345 will be fulfilled with /shell
    navigateFallback: '/shell',

    // Various runtime caching strategies: sets up sw-toolbox handlers.
    runtimeCaching: [{
      urlPattern: /www\.ifixit\.com\/api\/2\.0\//,
      // Effectively "stale while revalidate".
      handler: 'fastest'
    }, {
      urlPattern: /cloudfront\.net/,
      handler: 'cacheFirst',
      options: {
        cache: {
          name: 'image-cache',
          // Use sw-toolbox's LRU expiration.
          maxEntries: 50
        }
      }
    }, {
      // Use a network first strategy for everything else.
      default: 'networkFirst'
    }],

    // End of interesting bits...

    cacheId: packageJson.name,
    dontCacheBustUrlsMatching: /./,
    logger: gutil.log,
    stripPrefix: 'build/',
    verbose: true
  });
});

gulp.task('build:dev', ['clean'], callback => {
  process.env.NODE_ENV = 'development';
  sequence(
    ['bundle-app', 'bundle-third-party', 'copy-static', 'sass'],
    'version-assets',
    'generate-service-worker',
    callback
  );
});

gulp.task('build:dist', ['clean'], callback => {
  process.env.NODE_ENV = 'production';
  sequence(
    ['bundle-app', 'bundle-third-party', 'copy-static', 'sass', 'lint'],
    'uglify-js',
    'version-assets',
    'generate-service-worker',
    callback
  );
});

gulp.task('serve', callback => {
  spawn('node', ['index.js'], {stdio: 'inherit'})
    .on('error', error => callback(error))
    .on('exit', error => callback(error));
});

gulp.task('lint', () => {
  return gulp.src([`${SRC_DIR}/**/*.{js,jsx}`, '*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('default', callback => {
  sequence('build:dev', 'serve', callback);
});

process.on('SIGINT', process.exit);
