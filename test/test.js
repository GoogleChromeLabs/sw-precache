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

// Extra interfaces, like generateRuntimeCaching, are exposed while testing.
process.env.NODE_ENV = 'swprecache-test';

var assert = require('assert');
var externalFunctions = require('../lib/functions.js');
var fs = require('fs');
var generate = require('../lib/sw-precache.js').generate;
var generateRuntimeCaching = require('../lib/sw-precache.js').generateRuntimeCaching;
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

  it('should remove the hash fragment', function(done) {
    var strippedUrl = externalFunctions.stripIgnoredUrlParameters(testUrl + '#hash', [/^t/, /^f/]);
    assert.strictEqual(strippedUrl, 'http://example.com/index.html?one=1');
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

describe('createCacheKey', function() {
  it('should create the expected value when the original URL.search is empty', function(done) {
    var url = 'http://example.com/test/path';
    var cacheKey = externalFunctions.createCacheKey(url, 'name', 'value');
    assert.strictEqual(cacheKey, 'http://example.com/test/path?name=value');
    done();
  });

  it('should create the expected value when the original URL.search is not empty', function(done) {
    var url = 'http://example.com/test/path?existing=value';
    var cacheKey = externalFunctions.createCacheKey(url, 'name', 'value');
    assert.strictEqual(cacheKey, 'http://example.com/test/path?existing=value&name=value');
    done();
  });

  it('should append the parameter when the origin matches the exclusion pattern, but the pathname does not match', function(done) {
    var url = 'http://example.com/test/path?existing=value';
    var cacheKey = externalFunctions.createCacheKey(url, 'name', 'value', /example/);
    assert.strictEqual(cacheKey, 'http://example.com/test/path?existing=value&name=value');
    done();
  });

  it('should not append the parameter when the pathname matches the exclusion pattern', function(done) {
    var url = 'http://example.com/test/path?existing=value';
    var cacheKey = externalFunctions.createCacheKey(url, 'name', 'value', /test\/path/);
    assert.strictEqual(cacheKey, 'http://example.com/test/path?existing=value');
    done();
  });

  it('should append the parameter when the pathname does not match the exclusion pattern', function(done) {
    var url = 'http://example.com/test/path?existing=value';
    var cacheKey = externalFunctions.createCacheKey(url, 'name', 'value', /no_match/);
    assert.strictEqual(cacheKey, 'http://example.com/test/path?existing=value&name=value');
    done();
  });
});

describe('generateRuntimeCaching', function() {
  it('should handle an empty array', function() {
    assert.equal(generateRuntimeCaching([]), '');
  });

  it('should handle urlPattern string', function() {
    var code = generateRuntimeCaching([{
      urlPattern: '/*',
      handler: 'testHandler'
    }]);
    assert.equal(code, '\ntoolbox.router.get("/*", toolbox.testHandler, {});');
  });

  it('should handle urlPattern regex', function() {
    var code = generateRuntimeCaching([{
      urlPattern: /test/,
      handler: 'testHandler'
    }]);
    assert.equal(code, '\ntoolbox.router.get(/test/, toolbox.testHandler, {});');
  });

  it('should handle origin regex', function() {
    var code = generateRuntimeCaching([{
      urlPattern: '/*',
      handler: 'testHandler',
      options: {
        origin: /http:\/\/www.example\.com/
      }
    }]);
    assert.equal(code, '\ntoolbox.router.get("/*", toolbox.testHandler, {"origin":/http:\\/\\/www.example\\.com/});');
  });

  it('should handle origin string', function() {
    var code = generateRuntimeCaching([{
      urlPattern: '/*',
      handler: 'testHandler',
      options: {
        origin: 'http://www.example.com'
      }
    }]);
    assert.equal(code, '\ntoolbox.router.get("/*", toolbox.testHandler, {"origin":"http://www.example.com"});');
  });

  it('should handle successResponses regex', function() {
    var code = generateRuntimeCaching([{
      urlPattern: '/*',
      handler: 'testHandler',
      options: {
        successResponses: /^200$/
      }
    }]);
    assert.equal(code, '\ntoolbox.router.get("/*", toolbox.testHandler, {"successResponses":/^200$/});');
  });
});

describe('cleanResponse', function() {
  var responseText = 'test response body';
  var globalResponse = global.Response;

  before(function() {
    if (!globalResponse) {
      global.Response = require('node-fetch').Response;
    }
  });

  it('should return the same response when redirected is false', function() {
    var originalResponse = new global.Response(responseText);
    originalResponse.redirected = false;

    return externalFunctions.cleanResponse(originalResponse).then(function(cleanedResponse) {
      assert.strictEqual(originalResponse, cleanedResponse);
    });
  });

  it('should return a new response with the same body when redirected is true', function() {
    var originalResponse = new global.Response(responseText);
    originalResponse.redirected = true;

    return externalFunctions.cleanResponse(originalResponse).then(function(cleanedResponse) {
      assert.notStrictEqual(originalResponse, cleanedResponse);

      var bodyPromises = [originalResponse.text(), cleanedResponse.text()];
      return Promise.all(bodyPromises).then(function(bodies) {
        assert.equal(bodies[0], bodies[1]);
      });
    });
  });

  after(function() {
    if (!globalResponse) {
      delete global.Response;
    }
  });
});
