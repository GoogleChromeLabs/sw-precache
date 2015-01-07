'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')({pattern: '*'});
var crypto = require('crypto');
var fs = require('fs');

// This provides a safegaurd against accidentally precaching a very large file. It can be tweaked.
var MAXIMUM_CACHE_SIZE_IN_BYTES = 2 * 1024 * 1024; // 2MB

var DEV_DIR = 'app';
var DIST_DIR = 'dist';
var SERVICE_WORKER_HELPERS_DEV_DIR = DEV_DIR + '/service-worker-helpers';

function getFileAndSizeAndHashForFile(file) {
  var stat = fs.statSync(file);
  var buffer = fs.readFileSync(file);

  if (stat.isFile()) {
    return {
      file: file,
      size: stat.size,
      hash: getHash(buffer)
    };
  }

  return null;
}

function getFilesAndSizesAndHashesForGlobPattern(globPattern) {
  return $.glob.sync(globPattern).map(function(file) {
    return getFileAndSizeAndHashForFile(file);
  }).filter(function(fileAndSizeAndHash) {
    return fileAndSizeAndHash != null;
  });
}

function getHash(data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);

  return md5.digest('hex');
}

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
  var relativeUrlToHash = {};
  var cumulativeSize = 0;

  // Specify as many glob patterns as needed to indentify all the files that need to be cached.
  // If the same file is picked up by multiple patterns, it will only be cached once.
  var staticFileGlobs = [
    DIST_DIR + '/css/**.css',
    DIST_DIR + '/**.html',
    DIST_DIR + '/images/**.*',
    DIST_DIR + '/js/**.js'
  ];

  staticFileGlobs.forEach(function(globPattern) {
    var filesAndSizesAndHashes = getFilesAndSizesAndHashesForGlobPattern(globPattern);

    // The files returned from glob are sorted by default, so we don't need to sort here.
    filesAndSizesAndHashes.forEach(function(fileAndSizeAndHash) {
      if (fileAndSizeAndHash.size <= MAXIMUM_CACHE_SIZE_IN_BYTES) {
        // Strip the prefix to turn this into a URL relative to DIST_DIR.
        var relativeUrl = fileAndSizeAndHash.file.replace(DIST_DIR + '/', '');
        relativeUrlToHash[relativeUrl] = fileAndSizeAndHash.hash;

        $.util.log('  Added static URL', fileAndSizeAndHash.file, '-',
          fileAndSizeAndHash.size, 'bytes');
        cumulativeSize += fileAndSizeAndHash.size;
      } else {
        $.util.log('  Skipped', fileAndSizeAndHash.file, '-', fileAndSizeAndHash.size, 'bytes');
      }
    });
  });

  // Specify a mapping of "dynamic" URLs that depend on server-side generation with ALL the files
  // that uniquely determine their content. If any of the files that a given URL depends on changes,
  // then the URL will have a new hash associated with it and any previously cached versions will
  // be discarded.
  var dynamicUrlToDependencies = {
    'dynamic/page1': [DIST_DIR + '/views/layout.jade', DIST_DIR + '/views/page1.jade'],
    'dynamic/page2': [DIST_DIR + '/views/layout.jade', DIST_DIR + '/views/page2.jade']
  };

  Object.keys(dynamicUrlToDependencies).forEach(function(dynamicUrl) {
    var filesAndSizesAndHashes = dynamicUrlToDependencies[dynamicUrl]
      .sort()
      .map(getFileAndSizeAndHashForFile);
    var concatenatedHashes = '';

    filesAndSizesAndHashes.forEach(function(fileAndSizeAndHash) {
      // Let's assume that the response size of a server-generated page is roughly equal to the
      // total size of all its components.
      cumulativeSize += fileAndSizeAndHash.size;
      concatenatedHashes += fileAndSizeAndHash.hash;
    });

    relativeUrlToHash[dynamicUrl] = getHash(concatenatedHashes);
    $.util.log('  Added dynamic URL', dynamicUrl, 'with dependencies on',
      dynamicUrlToDependencies[dynamicUrl]);
  });

  // It's very important that running this operation multiple times with the same input files
  // produces identical output, since we need the generated service-worker.js file to change iff
  // the input files changes. The service worker update algorithm,
  // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#update-algorithm,
  // relies on detecting even a single byte change in service-worker.js to trigger an update.
  // Because of this, we write out the cache options as a series of sorted, nested arrays rather
  // than as objects whose serialized key ordering might vary.
  var relativeUrls = Object.keys(relativeUrlToHash);
  var cacheOptions = relativeUrls.sort().map(function(relativeUrl) {
    return [relativeUrl, relativeUrlToHash[relativeUrl]];
  });

  $.util.log('Total precache size is', Math.round(cumulativeSize / 1024),
    'KB for', relativeUrls.length, 'resources.');

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
