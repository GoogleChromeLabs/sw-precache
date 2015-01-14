var assert = require('assert');
var fs = require('fs');
var swPrecache = require('../sw-precache.js');

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
  it('should exclude files larger than the maximum size', function(done) {
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
