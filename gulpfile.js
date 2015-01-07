'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({pattern: '*'});
var swPrecache = require('./sw-precache.js');

var DEV_DIR = 'app';
var DIST_DIR = 'dist';
var SERVICE_WORKER_HELPERS_DEV_DIR = DEV_DIR + '/service-worker-helpers';

function runExpress(port, staticDir) {
  var app = $.express();

  app.use($.express.static(staticDir));
  app.set('views', staticDir + '/views');
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

gulp.task('default', ['serve-dist']);

gulp.task('build', function() {
  $.runSequence('copy-service-worker-files', 'copy-dev-to-dist', 'generate-service-worker-js');
});

gulp.task('clean', function() {
  $.del([DIST_DIR, SERVICE_WORKER_HELPERS_DEV_DIR]);
});

gulp.task('serve-dev', ['copy-service-worker-files'], function() {
  runExpress(3001, DEV_DIR);
});

gulp.task('serve-dist', ['build'], function() {
  runExpress(3000, DIST_DIR);
});

gulp.task('generate-service-worker-js', function() {
  var precacheConfig = swPrecache({
    staticFileGlobs: [
      DIST_DIR + '/css/**.css',
      DIST_DIR + '/**.html',
      DIST_DIR + '/images/**.*',
      DIST_DIR + '/js/**.js'
    ],
    dynamicUrlToDependencies: {
      'dynamic/page1': [DIST_DIR + '/views/layout.jade', DIST_DIR + '/views/page1.jade'],
      'dynamic/page2': [DIST_DIR + '/views/layout.jade', DIST_DIR + '/views/page2.jade']
    },
    stripPrefix: DIST_DIR + '/'
  });

  // TODO: I'm SURE there's a better way of inserting serialized JavaScript into a file than
  // calling JSON.stringify() and throwing it into a lo-dash template.
  return gulp.src('service-worker-helpers/service-worker.tmpl')
    .pipe($.template({precacheConfig: JSON.stringify(precacheConfig)}))
    .pipe($.rename('service-worker.js'))
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('copy-dev-to-dist', function() {
  return gulp.src(DEV_DIR + '/**')
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('copy-service-worker-files', function() {
  return gulp.src('service-worker-helpers/*.js')
    .pipe(gulp.dest(SERVICE_WORKER_HELPERS_DEV_DIR));
});
