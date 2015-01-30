var assert = require('assert');
var externalFunctions = require('../lib/functions.js');
var fs = require('fs');
var swPrecache = require('../lib/sw-precache.js');
var URL = require('dom-urls');

var NOOP = function() {};
var TEMP_FILE = 'test/data/temp.txt';

describe('sw-precache core functionality', function() {
  before(function() {
    fs.writeFileSync(TEMP_FILE, 'initial data');
  });
  
  it('should produce valid JavaScript', function(done) {
    swPrecache({logger: NOOP}, function(error, responseString) {
      assert.ifError(error);
      assert.doesNotThrow(function() {
        new Function(responseString);
        done();
      });
    });
  });

  it('should produce the same output given the same input files', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: ['test/data/one/**']
    };

    swPrecache(config, function(error, responseStringOne) {
      assert.ifError(error);
      swPrecache(config, function(error, responseStringTwo) {
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

    swPrecache(configOne, function(error, responseStringOne) {
      assert.ifError(error);
      swPrecache(configTwo, function(error, responseStringTwo) {
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

    swPrecache(config, function(error, reponseString) {
      assert.ifError(error);
      swPrecache(configPrime, function(error, responseStringPrime) {
        assert.ifError(error);
        assert.strictEqual(reponseString, responseStringPrime);
        done();
      });
    });
  });

  it('should produce different output when the contents of an input file changes', function(done) {
    var config = {
      logger: NOOP,
      staticFileGlobs: [TEMP_FILE]
    };

    swPrecache(config, function(error, responseString) {
      assert.ifError(error);
      fs.appendFileSync(TEMP_FILE, 'new data');
      swPrecache(config, function(error, responseStringPrime) {
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

describe('sw-precache parameters', function() {
  it('should exclude files larger than maximumFileSizeToCacheInBytes', function(done) {
    var file = 'test/data/one/a.txt';
    var size = fs.statSync(file).size;
    var config = {
      logger: NOOP,
      staticFileGlobs: [file],
      maximumFileSizeToCacheInBytes: size - 1
    };

    swPrecache(config, function(error, responseStringSmaller) {
      assert.ifError(error);
      config.maximumFileSizeToCacheInBytes = size;
      swPrecache(config, function(error, responseStringLarger) {
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

