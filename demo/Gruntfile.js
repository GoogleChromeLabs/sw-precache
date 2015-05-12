// This is a basic Gruntfile illustrating how to call the sw-precache library. It doesn't include
// all of the functionality from  the sample gulpfile, such as running a web server, or managing
// separate DEV and DIST directories.

var fs = require('fs');
var packageJson = require('../package.json');
var path = require('path');
var swPrecache = require('../lib/sw-precache.js');

module.exports = function(grunt) {
  grunt.initConfig({
    swPrecache: {
      dev: {
        handleFetch: false,
        rootDir: 'app'
      }
    }
  });

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
      // If handleFetch is false (i.e. because this is called from swPrecache:dev), then
      // the service worker will precache resources but won't actually serve them.
      // This allows you to test precaching behavior without worry about the cache preventing your
      // local changes from being picked up during the development cycle.
      handleFetch: handleFetch,
      logger: grunt.log.writeln,
      staticFileGlobs: [
        rootDir + '/css/**.css',
        rootDir + '/**.html',
        rootDir + '/images/**.*',
        rootDir + '/js/**.js'
      ],
      stripPrefix: rootDir + '/'
    };

    swPrecache(config, callback);
  }

  grunt.registerMultiTask('swPrecache', function() {
    var done = this.async();
    var rootDir = this.data.rootDir;
    var handleFetch = this.data.handleFetch;

    generateServiceWorkerFileContents(rootDir, handleFetch, function(error, serviceWorkerFileContents) {
      if (error) {
        grunt.fail.warn(error);
      }
      fs.writeFile(path.join(rootDir, 'service-worker.js'), serviceWorkerFileContents, function(error) {
        if (error) {
          grunt.fail.warn(error);
        }
        done();
      });
    });
  });
};
