'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({pattern: '*'});
var crypto = require('crypto');
var fs = require('fs');

var DEV_DIR = 'app';
var DIST_DIR = 'dist';
var SERVICE_WORKER_HELPERS_DEV_DIR = DEV_DIR + '/service-worker-helpers';

function getFilesAndHashForGlobPattern(globPattern) {
  // TODO: I'd imagine there's some gulp plugin that could automate all this.
  var files = $.glob.sync(globPattern).filter(function(file) {
    var stat = fs.statSync(file);
    return stat.isFile();
  });

  var md5Hashes = files.map(function(file) {
    var buffer = fs.readFileSync(file);
    return getHash(buffer);
  });

  var concatenatedHashes = md5Hashes.sort().join('');
  return {
    hash: getHash(concatenatedHashes),
    files: files
  };
}

function getHash(data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);

  return md5.digest('hex');
}

gulp.task('build', function() {
  $.runSequence('copy-service-worker-files', 'copy-dev-to-dist', 'generate-service-worker-js');
});

gulp.task('clean', function() {
  $.del([DIST_DIR, SERVICE_WORKER_HELPERS_DEV_DIR]);
});

gulp.task('serve-dev', ['copy-service-worker-files'], function() {
  $.browserSync({
    notify: false,
    server: DEV_DIR
  });

  gulp.watch(DEV_DIR + '/**', $.browserSync.reload);
});

gulp.task('serve-dist', ['build'], function() {
  $.browserSync({
    notify: false,
    server: DIST_DIR
  });
});

gulp.task('generate-service-worker-js', function() {
  // Each entry will be treated as a separate logical cache. If any file that matches the glob
  // pattern for an entry is changed/added/deleted, that will cause the entire logical cache to
  // expire and be re-fetched.
  // In this example, we divide up the entries based on file types, but it would be equally
  // reasonable to divide up entries with globs that group relatively non-volatile files into one
  // cache and files that are more likely to change in another cache.
  // TODO: Can this be converted to use gulp.src() somehow? Is that preferable?
  var fileSets = {
    css: DIST_DIR + '/css/**.css',
    html: DIST_DIR + '/**.html',
    images: DIST_DIR + '/images/**.*',
    js: DIST_DIR + '/js/**.js'
  };
  
  // It's very important that running this operation multiple times with the same input files
  // produces identical output, since we need the generated service-worker.js file to change iff
  // the input files changes. The service worker update algorithm,
  // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#update-algorithm,
  // relies on detecting even a single byte change in service-worker.js to trigger an update.
  // Because of this, we write out the cache options as a series of sorted, nested arrays rather
  // than as objects whose serialized key ordering might vary.
  var cacheOptions = Object.keys(fileSets).sort().map(function(key) {
    var filesAndHash = getFilesAndHashForGlobPattern(fileSets[key]);
    return [key, filesAndHash.hash, filesAndHash.files.map(function(file) {
      return file.replace(DIST_DIR + '/', '');
    })];
  });

  // TODO: I'm SURE there's a better way of inserting serialized JavaScript into a file than
  // calling JSON.stringify() and throwing it into a lo-dash template.
  return gulp.src('service-worker-helpers/service-worker.tmpl')
    .pipe($.template({cacheOptions: JSON.stringify(cacheOptions)}))
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
