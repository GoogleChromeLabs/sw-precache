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

 // This is a test and we want descriptions to be useful, if this
 // breaks the max-length, it's ok.

 /* eslint-disable max-len */
/* eslint-env node, mocha */
'use strict';

var assert = require('assert');
var externalFunctions = require('../lib/functions.js');
var fs = require('fs');
var generate = require('../lib/sw-precache.js').generate;
var path = require('path');
var write = require('../lib/sw-precache.js').write;

var NOOP = function() {};

describe('sw-precache core functionality', function() {
  var TEMP_FILE = 'test/data/temp.txt';

  before(function() {
    fs.writeFileSync(TEMP_FILE, 'initial data');
  });

  it('should produce valid JavaScript', function(done) {
    generate({logger: NOOP}, function(error, responseString) {
      assert.ifError(error);
      assert.doesNotThrow(function() {
        /* eslint-disable no-new, no-new-func */
        new Function(responseString);
        /* eslint-enable no-new, no-new-func */
        done();
      });
    });
  });

  it('should return a promise that resolves with the same output', function(done) {
    generate({logger: NOOP}).then(function(responseStringOne) {
      generate({logger: NOOP}, function(error, responseStringTwo) {
        assert.ifError(error);

        assert.strictEqual(responseStringOne, responseStringTwo);
        done();
      });
    }, assert.ifError);
  });

  it('should produce the same output given the same input files', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: ['test/data/one/**']
    };

    generate(config, function(error, responseStringOne) {
      assert.ifError(error);
      generate(config, function(error, responseStringTwo) {
        assert.ifError(error);
        assert.strictEqual(responseStringOne, responseStringTwo);
        done();
      });
    });
  });

  it('should produce different output given different input files', function(done) {
    var configOne = {
      logger: NOOP,
      staticFileGlobs: ['test/data/one/**']
    };

    var configTwo = {
      logger: NOOP,
      staticFileGlobs: ['test/data/two/**']
    };

    generate(configOne, function(error, responseStringOne) {
      assert.ifError(error);
      generate(configTwo, function(error, responseStringTwo) {
        assert.ifError(error);
        assert.notStrictEqual(responseStringOne, responseStringTwo);
        done();
      });
    });
  });

  it('should produce the same output regardless of which order the globs are in', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/a.txt',
        'test/data/one/c.txt',
        'test/data/two/b.txt'
      ]
    };

    var configPrime = {
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/c.txt',
        'test/data/two/b.txt',
        'test/data/one/a.txt'
      ]
    };

    generate(config, function(error, responseString) {
      assert.ifError(error);
      generate(configPrime, function(error, responseStringPrime) {
        assert.ifError(error);
        assert.strictEqual(responseString, responseStringPrime);
        done();
      });
    });
  });

  it('should produce different output when the contents of an input file changes', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: [TEMP_FILE]
    };

    generate(config, function(error, responseString) {
      assert.ifError(error);
      fs.appendFileSync(TEMP_FILE, 'new data');
      generate(config, function(error, responseStringPrime) {
        assert.ifError(error);
        assert.notStrictEqual(responseString, responseStringPrime);
        done();
      });
    });
  });

  it('should produce the same output when stripPrefix doesn\'t match the file prefixes', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/a.txt',
        'test/data/one/c.txt',
        'test/data/two/b.txt'
      ],
      stripPrefix: '.'
    };

    var configPrime = {
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/c.txt',
        'test/data/two/b.txt',
        'test/data/one/a.txt'
      ]
    };

    generate(config, function(error, responseString) {
      assert.ifError(error);
      generate(configPrime, function(error, responseStringPrime) {
        assert.ifError(error);
        assert.strictEqual(responseString, responseStringPrime);
        done();
      });
    });
  });

  it('should produce different output when stripPrefix matches the file prefixes', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/a.txt',
        'test/data/one/c.txt',
        'test/data/two/b.txt'
      ],
      stripPrefix: 'test'
    };

    var configPrime = {
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/c.txt',
        'test/data/two/b.txt',
        'test/data/one/a.txt'
      ]
    };

    generate(config, function(error, responseString) {
      assert.ifError(error);
      generate(configPrime, function(error, responseStringPrime) {
        assert.ifError(error);
        assert.notStrictEqual(responseString, responseStringPrime);
        done();
      });
    });
  });

  after(function() {
    fs.unlinkSync(TEMP_FILE);
  });
});

describe('sw-precache write functionality', function() {
  var SW_FILE = 'test/data/generated_sw.js';

  it('should write to disk', function(done) {
    write(SW_FILE, {logger: NOOP}, function(error) {
      assert.ifError(error);
      fs.stat(SW_FILE, function(error, stats) {
        assert.ifError(error);
        assert(stats.isFile(), 'file exists');
        assert(stats.size > 0, 'file contains data');
        done();
      });
    });
  });

  it('should return a promise that resolves when the file has been written', function(done) {
    write(SW_FILE, {logger: NOOP}).then(function() {
      fs.stat(SW_FILE, function(error, stats) {
        assert.ifError(error);
        assert(stats.isFile(), 'file exists');
        assert(stats.size > 0, 'file contains data');
        done();
      });
    }, assert.ifError);
  });

  afterEach(function() {
    fs.unlinkSync(SW_FILE);
  });
});

describe('sw-precache write functionality with missing parent directory', function() {
  var SW_FILE = 'test/data/new_directory/generated_sw.js';

  it('should write to disk, creating a new parent directory', function(done) {
    write(SW_FILE, {logger: NOOP}, function(error) {
      assert.ifError(error);
      fs.stat(SW_FILE, function(error, stats) {
        assert.ifError(error);
        assert(stats.isFile(), 'file exists');
        assert(stats.size > 0, 'file contains data');
        done();
      });
    });
  });

  after(function() {
    fs.unlinkSync(SW_FILE);
    fs.rmdirSync(path.dirname(SW_FILE));
  });
});

describe('sw-precache parameters', function() {
  it('should exclude files larger than maximumFileSizeToCacheInBytes', function(done) {
    var file = 'test/data/one/a.txt';
    var size = fs.statSync(file).size;
    var config = {
      logger: NOOP,
      staticFileGlobs: [file],
      maximumFileSizeToCacheInBytes: size - 1
    };

    generate(config, function(error, responseStringSmaller) {
      assert.ifError(error);
      config.maximumFileSizeToCacheInBytes = size;
      generate(config, function(error, responseStringLarger) {
        assert.ifError(error);
        assert(responseStringSmaller.length < responseStringLarger.length);
        done();
      });
    });
  });
});

describe('stripIgnoredUrlParameters', function() {
  var testUrl = 'http://example.com/index.html?one=1&two=2&three=3&four&five=5';

  it('should return the same URL when the URL doesn\'t have a query string', function(done) {
    var querylessUrl = 'http://example.com/index.html';
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(querylessUrl, [/./]);
    assert.strictEqual(strippedUrl, querylessUrl);
    done();
  });

  it('should strip out all parameters when [/./] is used', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl, [/./]);
    assert.strictEqual(strippedUrl, 'http://example.com/index.html');
    done();
  });

  it('should not do anything when [] is used', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl, []);
    assert.strictEqual(strippedUrl, testUrl);
    done();
  });

  it('should not do anything when a non-matching regex is used', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl, [/dummy/]);
    assert.strictEqual(strippedUrl, testUrl);
    done();
  });

  it('should work when a key without a value is matched', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl, [/four/]);
    assert.strictEqual(strippedUrl, 'http://example.com/index.html?one=1&two=2&three=3&five=5');
    done();
  });

  it('should work when a single regex matches multiple keys', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl, [/^t/]);
    assert.strictEqual(strippedUrl, 'http://example.com/index.html?one=1&four&five=5');
    done();
  });

  it('should work when a multiples regexes each match multiple keys', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl, [/^t/, /^f/]);
    assert.strictEqual(strippedUrl, 'http://example.com/index.html?one=1');
    done();
  });

  it('should work when there\'s a hash fragment', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl + '#hash', [/^t/, /^f/]);
    assert.strictEqual(strippedUrl, 'http://example.com/index.html?one=1#hash');
    done();
  });
});

describe('populateCurrentCacheNames', function() {
  var precacheConfig = [
    ['./', '123'],
    ['css/main.css', 'abc']
  ];
  var cacheNamePrefix = 'test-prefix-';
  var baseUrl = 'http://example.com/';

  it('should return valid mappings', function(done) {
    var expectedMappings = {
      absoluteUrlToCacheName: {
        'http://example.com/': 'test-prefix-http://example.com/-123',
        'http://example.com/css/main.css': 'test-prefix-http://example.com/css/main.css-abc'
      },
      currentCacheNamesToAbsoluteUrl: {
        'test-prefix-http://example.com/css/main.css-abc': 'http://example.com/css/main.css',
        'test-prefix-http://example.com/-123': 'http://example.com/'
      }
    };
    var mappings = externalFunctions.populateCurrentCacheNames(precacheConfig, cacheNamePrefix,
      baseUrl);
    assert.deepEqual(mappings, expectedMappings);
    done();
  });
});

describe('addDirectoryIndex', function() {
  var directoryIndex = 'index.html';

  it('should append the directory index when the URL ends with /', function(done) {
    var url = 'http://example.com/';
    var urlWithIndex = externalFunctions.addDirectoryIndex(url, directoryIndex);
    assert.strictEqual(urlWithIndex, 'http://example.com/index.html');
    done();
  });

  it('should append the directory index when the URL has an implicit /', function(done) {
    var url = 'http://example.com';
    var urlWithIndex = externalFunctions.addDirectoryIndex(url, directoryIndex);
    assert.strictEqual(urlWithIndex, 'http://example.com/index.html');
    done();
  });

  it('should not do anything when the URL does not end in /', function(done) {
    var url = 'http://example.com/path/file.txt';
    var urlWithIndex = externalFunctions.addDirectoryIndex(url, directoryIndex);
    assert.strictEqual(urlWithIndex, url);
    done();
  });

  it('should append the directory index without modifying URL parameters', function(done) {
    var url = 'http://example.com?test=param';
    var urlWithIndex = externalFunctions.addDirectoryIndex(url, directoryIndex);
    assert.strictEqual(urlWithIndex, 'http://example.com/index.html?test=param');
    done();
  });
});

describe('getCacheBustedUrl', function() {
  it('should append the cache-busting parameter', function(done) {
    var url = 'http://example.com/';
    var cacheBustedUrl = externalFunctions.getCacheBustedUrl(url);
    assert.notStrictEqual(url, cacheBustedUrl);
    done();
  });

  it('should produce the same output when called with the same "now" parameter', function(done) {
    var url = 'http://example.com/';
    var now = 123;
    var cacheBustedUrl = externalFunctions.getCacheBustedUrl(url, now);
    var cacheBustedUrlPrime = externalFunctions.getCacheBustedUrl(url, now);
    assert.strictEqual(cacheBustedUrl, cacheBustedUrlPrime);
    done();
  });

  it('should produce different output when called twice, with a delay in between', function(done) {
    var url = 'http://example.com/';
    var cacheBustedUrl = externalFunctions.getCacheBustedUrl(url);
    setTimeout(function() {
      var cacheBustedUrlPrime = externalFunctions.getCacheBustedUrl(url);
      assert.notStrictEqual(cacheBustedUrl, cacheBustedUrlPrime);
      done();
    }, 2);
  });

  it('should append the URL parameter without modifying any existing parameters', function(done) {
    var url = 'http://example.com/?one=two';
    var cacheBustedUrl = externalFunctions.getCacheBustedUrl(url);
    // The cache-busted URL should consist of the basic URL, followed by '&' and then the
    // cached-busting parameters, in order to keep the same semantics.
    assert(cacheBustedUrl.indexOf(url + '&') === 0);
    done();
  });
});

describe('isPathWhitelisted', function() {
  var url = 'http://example.com/test/path?one=two';

  it('should return true when passed an empty whitelist', function(done) {
    assert(externalFunctions.isPathWhitelisted([], url));
    done();
  });

  it('should return true when passed a whitelist matching the url', function(done) {
    assert(externalFunctions.isPathWhitelisted([/^\/test\/path$/], url));
    done();
  });

  it('should return false when passed a whitelist not matching the url', function(done) {
    assert(!externalFunctions.isPathWhitelisted([/^oops$/], url));
    done();
  });

  it('should return true when passed a whitelist whose second value matches the url', function(done) {
    assert(externalFunctions.isPathWhitelisted([/^oops$/, /^\/test\/path$/], url));
    done();
  });
});
