/* eslint-env node */

'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var express = require('express');
var ghPages = require('gh-pages');
var packageJson = require('../package.json');
var path = require('path');
var runSequence = require('run-sequence');
var swPrecache = require('../lib/sw-precache.js');

var DEV_DIR = 'app';
var DIST_DIR = 'dist';

function runExpress(port, rootDir) {
  var app = express();

  app.use(express.static(rootDir));
  app.set('views', path.join(rootDir, 'views'));
  app.set('view engine', 'jade');

  app.get('/dynamic/:page', function(req, res) {
    res.render(req.params.page);
  });

  var server = app.listen(port, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server running at http://%s:%s', host, port);
  });
}

function writeServiceWorkerFile(rootDir, handleFetch, callback) {
  var config = {
    cacheId: packageJson.name,
    /*
    dynamicUrlToDependencies: {
      'dynamic/page1': [
        path.join(rootDir, 'views', 'layout.jade'),
        path.join(rootDir, 'views', 'page1.jade')
      ],
      'dynamic/page2': [
        path.join(rootDir, 'views', 'layout.jade'),
        path.join(rootDir, 'views', 'page2.jade')
      ]
    },
    */
    // If handleFetch is false (i.e. because this is called from generate-service-worker-dev), then
    // the service worker will precache resources but won't actually serve them.
    // This allows you to test precaching behavior without worry about the cache preventing your
    // local changes from being picked up during the development cycle.
    handleFetch: handleFetch,
    logger: $.util.log,
    runtimeCaching: [{
      // See https://github.com/GoogleChrome/sw-toolbox#methods
      urlPattern: /runtime-caching/,
      handler: 'cacheFirst',
      // See https://github.com/GoogleChrome/sw-toolbox#options
      options: {
        cache: {
          maxEntries: 1,
          name: 'runtime-cache'
        }
      }
    }],
    staticFileGlobs: [
      rootDir + '/css/**.css',
      rootDir + '/**.html',
      rootDir + '/images/**.*',
      rootDir + '/js/**.js'
    ],
    stripPrefix: rootDir + '/',
    // verbose defaults to false, but for the purposes of this demo, log more.
    verbose: true
  };

  swPrecache.write(path.join(rootDir, 'service-worker.js'), config, callback);
}

gulp.task('default', ['serve-dist']);

gulp.task('build', function(callback) {
  runSequence('copy-dev-to-dist', 'generate-service-worker-dist', callback);
});

gulp.task('clean', function() {
  del.sync([DIST_DIR]);
});

gulp.task('serve-dev', ['generate-service-worker-dev'], function() {
  runExpress(3001, DEV_DIR);
});

gulp.task('serve-dist', ['build'], function() {
  runExpress(3000, DIST_DIR);
});

gulp.task('gh-pages', ['build'], function(callback) {
  ghPages.publish(path.join(__dirname, DIST_DIR), callback);
});

gulp.task('generate-service-worker-dev', function(callback) {
  writeServiceWorkerFile(DEV_DIR, false, callback);
});

gulp.task('generate-service-worker-dist', function(callback) {
  writeServiceWorkerFile(DIST_DIR, true, callback);
});

gulp.task('copy-dev-to-dist', function() {
  return gulp.src(DEV_DIR + '/**')
    .pipe(gulp.dest(DIST_DIR));
});
