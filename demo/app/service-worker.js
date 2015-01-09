'use strict';



var PrecacheConfig = [["css/main.css","3cb4f06fd9e705bea97eb1bece31fd6d"],["dynamic/page1","7ea130186a1087177c3f587e510709c3"],["dynamic/page2","cf458509f6e510a24c0e9f7245337cd4"],["images/Bocce.jpg","cb48e04813cca3934805ccd212c7a313"],["images/one.png","c5a951f965e6810d7b65615ee0d15053"],["images/two.png","29d2cd301ed1e5497e12cafee35a0188"],["index.html","fb0d3531519c4dc6f358578eef9e7788"],["js/a.js","abcb1c5b4c6752aed90979fb3b6cf77a"],["js/b.js","d8e5842f1710f6f4f8fe2fe322a73ade"],["js/service-worker-registration.js","1db3f5dc04b2bd8e3564c597f6161434"]];
var CACHE_NAME_PREFIX = 'sw-precache-';

function getCacheNameFromCacheOption(cacheOption) {
  return CACHE_NAME_PREFIX + cacheOption[0] + '-' + cacheOption[1];
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.keys().then(function(allCacheNames) {
      console.log('During the install phase, the current cache names are:', allCacheNames);
      Promise.all(
        PrecacheConfig.filter(function(cacheOption) {
          var cacheName = getCacheNameFromCacheOption(cacheOption);
          return allCacheNames.indexOf(cacheName) == -1;
        }).map(function(cacheOption) {
          var cacheName = getCacheNameFromCacheOption(cacheOption);
          console.log('About to add %O to cache named %s', cacheOption[0], cacheName);
          return caches.open(cacheName).then(function(cache) {
            return cache.add(cacheOption[0]);
          });
        })
      )
    })
  );
});

self.addEventListener('activate', function(event) {
  var currentCacheNames = PrecacheConfig.map(getCacheNameFromCacheOption);

  event.waitUntil(
    caches.keys().then(function(allCacheNames) {
      console.log('During the activate phase, the current cache names are:', allCacheNames);
      return Promise.all(
        allCacheNames.filter(function(cacheName) {
          return cacheName.indexOf(CACHE_NAME_PREFIX) == 0 &&
                 currentCacheNames.indexOf(cacheName) == -1;
        }).map(function(cacheName) {
          console.log('About to delete the out-of-date cache named:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
});




// From https://github.com/coonsta/cache-polyfill/blob/master/dist/serviceworker-cache-polyfill.js

if (!Cache.prototype.add) {
  Cache.prototype.add = function add(request) {
    return this.addAll([request]);
  };
}

if (!Cache.prototype.addAll) {
  Cache.prototype.addAll = function addAll(requests) {
    var cache = this;

    // Since DOMExceptions are not constructable:
    function NetworkError(message) {
      this.name = 'NetworkError';
      this.code = 19;
      this.message = message;
    }
    NetworkError.prototype = Object.create(Error.prototype);

    return Promise.resolve().then(function() {
      if (arguments.length < 1) throw new TypeError();

      // Simulate sequence<(Request or USVString)> binding:
      var sequence = [];

      requests = requests.map(function(request) {
        if (request instanceof Request) {
          return request;
        }
        else {
          return String(request); // may throw TypeError
        }
      });

      return Promise.all(
          requests.map(function(request) {
            if (typeof request === 'string') {
              request = new Request(request);
            }

            var scheme = new URL(request.url).protocol;

            if (scheme !== 'http:' && scheme !== 'https:') {
              throw new NetworkError("Invalid scheme");
            }

            return fetch(request.clone());
          })
      );
    }).then(function(responses) {
      // TODO: check that requests don't overwrite one another
      // (don't think this is possible to polyfill due to opaque responses)
      return Promise.all(
          responses.map(function(response, i) {
            return cache.put(requests[i], response);
          })
      );
    }).then(function() {
      return undefined;
    });
  };
}

if (!CacheStorage.prototype.match) {
  // This is probably vulnerable to race conditions (removing caches etc)
  CacheStorage.prototype.match = function match(request, opts) {
    var caches = this;

    return this.keys().then(function(cacheNames) {
      var match;

      return cacheNames.reduce(function(chain, cacheName) {
        return chain.then(function() {
          return match || caches.open(cacheName).then(function(cache) {
                return cache.match(request, opts);
              }).then(function(response) {
                match = response;
                return match;
              });
        });
      }, Promise.resolve());
    });
  };
}

