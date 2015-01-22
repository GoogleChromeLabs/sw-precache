'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({pattern: '*'});
var fs = require('fs');
var packageJson = require('../package.json');
var path = require('path');
var swPrecache = require('../sw-precache.js');

var DEV_DIR = 'app';
var DIST_DIR = 'dist';

function runExpress(port, rootDir) {
  var app = $.express();

  app.use($.express.static(rootDir));
  app.set('views', path.join(rootDir, 'views'));
  app.set('view engine', 'jade');

  app.get('/dynamic/:page', function (req, res) {
    res.render(req.params.page);
  });

  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server running at http://%s:%s', host, port);
  });
}

function generateServiceWorkerFileContents(rootDir, handleFetch, callback) {
  var config = {
    cacheId: packageJson.name,
    dynamicUrlToDependencies: {
      './': [path.join(rootDir, 'index.html')],
      'dynamic/page1': [
        path.join(rootDir, 'views', 'layout.jade'),
        path.join(rootDir, 'views', 'page1.jade')
      ],
      'dynamic/page2': [
        path.join(rootDir, 'views', 'layout.jade'),
        path.join(rootDir, 'views', 'page2.jade')
      ]
    },
    handleFetch: handleFetch,
    logger: $.util.log,
    staticFileGlobs: [
      rootDir + '/css/**.css',
      rootDir + '/**.html',
      rootDir + '/images/**.*',
      rootDir + '/js/**.js'
    ],
    stripPrefix: path.join(rootDir, path.sep)
  };

  swPrecache(config, callback);
}

gulp.task('default', ['serve-dist']);

gulp.task('build', function(callback) {
  $.runSequence('copy-dev-to-dist', 'generate-service-worker-dist', callback);
});

gulp.task('clean', function() {
  $.del([DIST_DIR]);
});

gulp.task('serve-dev', ['generate-service-worker-dev'], function() {
  runExpress(3001, DEV_DIR);
});

gulp.task('serve-dist', ['build'], function() {
  runExpress(3000, DIST_DIR);
});

gulp.task('gh-pages', ['build'], function () {
  return gulp.src(DIST_DIR + '/**/*')
    .pipe($.ghPages({remoteUrl: 'https://github.com/jeffposnick/sw-precache'}));
});

gulp.task('generate-service-worker-dev', function(callback) {
  generateServiceWorkerFileContents(DEV_DIR, false, function(error, serviceWorkerFileContents) {
    if (error) {
      return callback(error);
    }
    fs.writeFile(path.join(DEV_DIR, 'service-worker.js'), serviceWorkerFileContents, function(error) {
      if (error) {
        return callback(error);
      }
      callback();
    });
  });
});

gulp.task('generate-service-worker-dist', function(callback) {
  generateServiceWorkerFileContents(DIST_DIR, true, function(error, serviceWorkerFileContents) {
    if (error) {
      return callback(error);
    }
    fs.writeFile(path.join(DIST_DIR, 'service-worker.js'), serviceWorkerFileContents, function(error) {
      if (error) {
        return callback(error);
      }
      callback();
    });
  });
});

gulp.task('copy-dev-to-dist', function() {
  return gulp.src(DEV_DIR + '/**')
    .pipe(gulp.dest(DIST_DIR));
});
