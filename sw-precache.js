'use strict';

var crypto = require('crypto');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var util = require('util');
var _ = require('lodash');

function getFileAndSizeAndHashForFile(file) {
  var stat = fs.statSync(file);

  if (stat.isFile()) {
    var buffer = fs.readFileSync(file);
    return {
      file: file,
      size: stat.size,
      hash: getHash(buffer)
    };
  }

  return null;
}

function getFilesAndSizesAndHashesForGlobPattern(globPattern) {
  return glob.sync(globPattern).map(function(file) {
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

function formatBytesAsString(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  }

  if (bytes < (1024 * 1024)) {
    return Math.round(bytes / 1024) + ' KB';
  }

  return Math.round(bytes / (1024 * 1024)) + ' MB';
}

module.exports = function(params, callback) {
  _.defaults(params, {
    dynamicUrlToDependencies: {},
    handleFetch: true,
    importScripts: [],
    includeCachePolyfill: true,
    logger: console.log,
    maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB
    stripPrefix: '',
    staticFileGlobs: [],
    templateFilePath: path.dirname(fs.realpathSync(__filename)) + '/service-worker.tmpl'
  });

  var relativeUrlToHash = {};
  var cumulativeSize = 0;

  params.staticFileGlobs.forEach(function(globPattern) {
    var filesAndSizesAndHashes = getFilesAndSizesAndHashesForGlobPattern(globPattern);

    // The files returned from glob are sorted by default, so we don't need to sort here.
    filesAndSizesAndHashes.forEach(function(fileAndSizeAndHash) {
      if (fileAndSizeAndHash.size <= params.maximumFileSizeToCacheInBytes) {
        // Strip the prefix to turn this into a relative URL.
        var relativeUrl = fileAndSizeAndHash.file.replace(params.stripPrefix, '');
        relativeUrlToHash[relativeUrl] = fileAndSizeAndHash.hash;

        params.logger(util.format("Caching static resource '%s' (%s)", fileAndSizeAndHash.file,
          formatBytesAsString(fileAndSizeAndHash.size)));
        cumulativeSize += fileAndSizeAndHash.size;
      } else {
        params.logger(util.format("Skipping static resource '%s' (%s) - max size is %s",
          fileAndSizeAndHash.file, formatBytesAsString(fileAndSizeAndHash.size),
          formatBytesAsString(params.maximumFileSizeToCacheInBytes)));
      }
    });
  });

  Object.keys(params.dynamicUrlToDependencies).forEach(function(dynamicUrl) {
    var filesAndSizesAndHashes = params.dynamicUrlToDependencies[dynamicUrl]
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
    params.logger(util.format("Caching dynamic URL '%s' with dependencies on %j",
      dynamicUrl, params.dynamicUrlToDependencies[dynamicUrl]));
  });

  // It's very important that running this operation multiple times with the same input files
  // produces identical output, since we need the generated service-worker.js file to change iff
  // the input files changes. The service worker update algorithm,
  // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#update-algorithm,
  // relies on detecting even a single byte change in service-worker.js to trigger an update.
  // Because of this, we write out the cache options as a series of sorted, nested arrays rather
  // than as objects whose serialized key ordering might vary.
  var relativeUrls = Object.keys(relativeUrlToHash);
  var precacheConfig = relativeUrls.sort().map(function(relativeUrl) {
    return [relativeUrl, relativeUrlToHash[relativeUrl]];
  });

  params.logger(util.format('Total precache size is about %s for %d resources.',
    formatBytesAsString(cumulativeSize), relativeUrls.length));

  fs.readFile(params.templateFilePath, {encoding: 'utf8'}, function(error, data) {
    if (error) {
      throw error;
    }

    var populatedTemplate = _.template(data, {
      handleFetch: params.handleFetch,
      importScripts: params.importScripts ? params.importScripts.map(JSON.stringify).join(',') : null,
      includeCachePolyfill: params.includeCachePolyfill,
      precacheConfig: JSON.stringify(precacheConfig)
    });

    callback(populatedTemplate);
  });
};
