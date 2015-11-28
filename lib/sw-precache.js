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

/* eslint-env node */
'use strict';

var crypto = require('crypto');
var defaults = require('lodash.defaults');
var externalFunctions = require('./functions.js');
var fs = require('fs');
var glob = require('glob');
var mkdirp = require('mkdirp');
var path = require('path');
var prettyBytes = require('pretty-bytes');
var template = require('lodash.template');
var util = require('util');
require('es6-promise').polyfill();

// This should only change if there are breaking changes in the cache format used by the SW.
var VERSION = 'v1';

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
  return glob.sync(globPattern.replace(path.sep, '/')).map(function(file) {
    return getFileAndSizeAndHashForFile(file);
  }).filter(function(fileAndSizeAndHash) {
    return fileAndSizeAndHash !== null;
  });
}

function getHash(data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);

  return md5.digest('hex');
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generate(params, callback) {
  return new Promise(function(resolve, reject) {
    params = defaults(params || {}, {
      cacheId: '',
      directoryIndex: 'index.html',
      dynamicUrlToDependencies: {},
      handleFetch: true,
      ignoreUrlParametersMatching: [/^utm_/],
      importScripts: [],
      logger: console.log,
      maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB
      navigateFallback: '',
      stripPrefix: '',
      replacePrefix: '',
      staticFileGlobs: [],
      remoteResources: [],
      templateFilePath: path.join(
        path.dirname(fs.realpathSync(__filename)), '..', 'service-worker.tmpl'),
      verbose: false
    });

    if (!Array.isArray(params.ignoreUrlParametersMatching)) {
      params.ignoreUrlParametersMatching = [params.ignoreUrlParametersMatching];
    }

    var relativeUrlToHash = {};
    var cumulativeSize = 0;

    params.staticFileGlobs.forEach(function(globPattern) {
      var filesAndSizesAndHashes = getFilesAndSizesAndHashesForGlobPattern(globPattern);

      // The files returned from glob are sorted by default, so we don't need to sort here.
      filesAndSizesAndHashes.forEach(function(fileAndSizeAndHash) {
        if (fileAndSizeAndHash.size <= params.maximumFileSizeToCacheInBytes) {
          // Strip the prefix to turn this into a relative URL.
          var relativeUrl = fileAndSizeAndHash.file
            .replace(new RegExp('^' + escapeRegExp(params.stripPrefix)), params.replacePrefix)
            .replace(path.sep, '/');
          relativeUrlToHash[relativeUrl] = fileAndSizeAndHash.hash;

          if (params.verbose) {
            params.logger(util.format('Caching static resource "%s" (%s)', fileAndSizeAndHash.file,
              prettyBytes(fileAndSizeAndHash.size)));
          }

          cumulativeSize += fileAndSizeAndHash.size;
        } else {
          params.logger(util.format('Skipping static resource "%s" (%s) - max size is %s',
            fileAndSizeAndHash.file, prettyBytes(fileAndSizeAndHash.size),
            prettyBytes(params.maximumFileSizeToCacheInBytes)));
        }
      });
    });

    Object.keys(params.dynamicUrlToDependencies).forEach(function(dynamicUrl) {
      if (!Array.isArray(params.dynamicUrlToDependencies[dynamicUrl])) {
        throw Error(util.format(
          'The value for the dynamicUrlToDependencies.%s option must be an Array.', dynamicUrl));
      }

      var filesAndSizesAndHashes = params.dynamicUrlToDependencies[dynamicUrl]
        .sort()
        .map(function(file) {
          try {
            return getFileAndSizeAndHashForFile(file);
          } catch (e) {
            // Provide some additional information about the failure if the file is missing.
            if (e.code === 'ENOENT') {
              params.logger(util.format(
                '%s was listed as a dependency for dynamic URL %s, but the file does not exist. ' +
                'Either remove the entry as a dependency, or correct the path to the file.',
                file, dynamicUrl
              ));
            }
            // Re-throw the exception unconditionally, since this should be treated as fatal.
            throw e;
          }
        });
      var concatenatedHashes = '';

      filesAndSizesAndHashes.forEach(function(fileAndSizeAndHash) {
        // Let's assume that the response size of a server-generated page is roughly equal to the
        // total size of all its components.
        cumulativeSize += fileAndSizeAndHash.size;
        concatenatedHashes += fileAndSizeAndHash.hash;
      });

      relativeUrlToHash[dynamicUrl] = getHash(concatenatedHashes);

      if (params.verbose) {
        params.logger(util.format('Caching dynamic URL "%s" with dependencies on %j',
          dynamicUrl, params.dynamicUrlToDependencies[dynamicUrl]));
      }
    });

    params.remoteResources.forEach(function(resource) {
      // To avoid the need for fetching remote resources and the additional
      // build time this would add to, assume that the resource URL is a unique
      // identifier of the resource and the URL would change for an updated
      // resource.
      var urlHash = getHash(resource);
      relativeUrlToHash[resource] = urlHash;

      if (params.verbose) {
        params.logger(util.format('Caching remote resource "%s"', resource));
      }
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
      prettyBytes(cumulativeSize), relativeUrls.length));

    fs.readFile(params.templateFilePath, 'utf8', function(error, data) {
      if (error) {
        if (callback) {
          callback(error);
        }

        return reject(error);
      }

      var populatedTemplate = template(data)({
        cacheId: params.cacheId,
        // Ensure that anything false is translated into '', since this will be treated as a string.
        directoryIndex: params.directoryIndex || '',
        externalFunctions: externalFunctions,
        handleFetch: params.handleFetch,
        ignoreUrlParametersMatching: params.ignoreUrlParametersMatching,
        importScripts: params.importScripts ? params.importScripts.map(JSON.stringify).join(',') : null,
        // Ensure that anything false is translated into '', since this will be treated as a string.
        navigateFallback: params.navigateFallback || '',
        precacheConfig: JSON.stringify(precacheConfig),
        version: VERSION
      });

      if (callback) {
        callback(null, populatedTemplate);
      }

      resolve(populatedTemplate);
    });
  });
}

function write(filePath, params, callback) {
  return new Promise(function(resolve, reject) {
    function finish(error, value) {
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }

      if (callback) {
        callback(error, value);
      }
    }

    mkdirp.sync(path.dirname(filePath));

    generate(params).then(function(serviceWorkerFileContents) {
      fs.writeFile(filePath, serviceWorkerFileContents, finish);
    }, finish);
  });
}

module.exports = {
  generate: generate,
  write: write
};
