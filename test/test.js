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
    swPrecache({logger: NOOP}, function(responseString) {
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

    swPrecache(config, function(responseStringOne) {
      swPrecache(config, function(responseStringTwo) {
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

    swPrecache(configOne, function(responseStringOne) {
      swPrecache(configTwo, function(responseStringTwo) {
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

    swPrecache(config, function(reponseString) {
      swPrecache(configPrime, function(responseStringPrime) {
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

    swPrecache(config, function(responseString) {
      fs.appendFileSync(TEMP_FILE, 'new data');
      swPrecache(config, function(responseStringPrime) {
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

    swPrecache(config, function(responseStringSmaller) {
      config.maximumFileSizeToCacheInBytes = size;
      swPrecache(config, function(responseStringLarger) {
        assert(responseStringSmaller.length < responseStringLarger.length);
        done();
      });
    });
  });
});
