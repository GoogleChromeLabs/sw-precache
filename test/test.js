var assert = require('assert');
var fs = require('fs');
var streamEqual = require('stream-equal');
var swPrecache = require('../sw-precache.js');

var NOOP = function() {};
var TEMP_FILE = 'test/data/temp.txt';

function readStreamIntoString(stream, callback) {
  var string = '';
  stream.setEncoding('utf8');
  stream.on('data', function(chunk) {
    string += chunk;
  });
  stream.on('end', function() {
    callback(string);
  });
}

describe('sw-precache core functionality', function() {
  before(function() {
    fs.writeFileSync(TEMP_FILE, 'initial data');
  });
  
  it('should produce valid JavaScript', function() {
    readStreamIntoString(swPrecache({logger: NOOP}), function(responseString) {
      assert.doesNotThrow(function() {
        new Function(responseString);
      });
    });
  });

  it('should produce the same output given the same input files', function() {
    var config = {
      logger: NOOP,
      staticFileGlobs: ['test/data/one/**']
    };

    var responseStreamOne = swPrecache(config);
    var responseStreamOnePrime = swPrecache(config);

    streamEqual(responseStreamOne, responseStreamOnePrime, function(err, equal) {
      assert.ifError(err);
      assert(equal);
    });
  });

  it('should produce different output given different input files', function() {
    var responseStreamOne = swPrecache({
      logger: NOOP,
      staticFileGlobs: ['test/data/one/**']
    });

    var responseStreamTwo = swPrecache({
      logger: NOOP,
      staticFileGlobs: ['test/data/two/**']
    });

    streamEqual(responseStreamOne, responseStreamTwo, function(err, equal) {
      assert.ifError(err);
      assert(!equal);
    });
  });

  it('should produce the same output regardless of which order the globs are in', function() {
    var responseStream = swPrecache({
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/a.txt',
        'test/data/one/c.txt',
        'test/data/two/b.txt'
      ]
    });

    var responseStreamPrime = swPrecache({
      logger: NOOP,
      staticFileGlobs: [
        'test/data/one/c.txt',
        'test/data/two/b.txt',
        'test/data/one/a.txt'
      ]
    });

    streamEqual(responseStream, responseStreamPrime, function(err, equal) {
      assert.ifError(err);
      assert(equal);
    });
  });

  it('should produce different output when the contents of an input file changes', function() {
    var config = {
      logger: NOOP,
      staticFileGlobs: [TEMP_FILE]
    };

    var responseStream = swPrecache(config);
    fs.appendFileSync(TEMP_FILE, 'new data');
    var responseStreamPrime = swPrecache(config);

    streamEqual(responseStream, responseStreamPrime, function(err, equal) {
      assert.ifError(err);
      assert(!equal);
    });
  });

  after(function() {
    fs.unlinkSync(TEMP_FILE);
  });
});

describe('sw-precache parameters', function() {
  it('should exclude files larger than the maximum size', function() {
    var file = 'test/data/one/a.txt';
    var size = fs.statSync(file).size;
    var config = {
      logger: NOOP,
      staticFileGlobs: [file],
      maximumFileSizeToCacheInBytes: size - 1
    };
    var responseStreamSmaller = swPrecache(config);
    config.maximumFileSizeToCacheInBytes = size;
    var responseStreamLarger = swPrecache(config);

    streamEqual(responseStreamSmaller, responseStreamLarger, function(err, equal) {
      assert.ifError(err);
      assert(!equal);
    });
  });
});
