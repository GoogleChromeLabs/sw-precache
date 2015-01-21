'use strict';



var PrecacheConfig = [["./","9c054a09acc5e7e87357f1c95864306e"],["css/main.css","3cb4f06fd9e705bea97eb1bece31fd6d"],["dynamic/page1","7ea130186a1087177c3f587e510709c3"],["dynamic/page2","cf458509f6e510a24c0e9f7245337cd4"],["images/one.png","c5a951f965e6810d7b65615ee0d15053"],["images/two.png","29d2cd301ed1e5497e12cafee35a0188"],["index.html","a296f770cc29401929029661383897a3"],["js/a.js","abcb1c5b4c6752aed90979fb3b6cf77a"],["js/b.js","d8e5842f1710f6f4f8fe2fe322a73ade"],["js/service-worker-registration.js","47c64e5064c930a6eb34d6fa1696bb95"]];
var CacheNamePrefix = 'sw-precache-v1-' + (self.registration ? self.registration.scope : '') + '-';

function getCacheNameFromCacheOption(cacheOption) {
  return CacheNamePrefix + cacheOption[0] + '-' + cacheOption[1];
}

function deleteAllCaches() {
  return caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        return caches.delete(cacheName);
      })
    );
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.keys().then(function(allCacheNames) {
      return Promise.all(
        PrecacheConfig.filter(function(cacheOption) {
          var cacheName = getCacheNameFromCacheOption(cacheOption);
          return allCacheNames.indexOf(cacheName) == -1;
        }).map(function(cacheOption) {
          var cacheName = getCacheNameFromCacheOption(cacheOption);
          console.log('Adding relative URL "%s" to cache named "%s"', cacheOption[0], cacheName);
          return caches.open(cacheName).then(function(cache) {
            return cache.add(new Request(cacheOption[0], {credentials: 'same-origin'}));
          });
        })
      ).then(function() {
        var currentCacheNames = PrecacheConfig.map(getCacheNameFromCacheOption);
        return Promise.all(
          allCacheNames.filter(function(cacheName) {
            return cacheName.indexOf(CacheNamePrefix) == 0 &&
                   currentCacheNames.indexOf(cacheName) == -1;
          }).map(function(cacheName) {
            console.log('Deleting out-of-date cache "%s"', cacheName);
            return caches.delete(cacheName);
          })
        )
      });
    }).then(function() {
      if (typeof self.skipWaiting == 'function') {
        // Force the SW to transition from installing -> active state
        self.skipWaiting();
      }
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data.command == 'delete_all') {
    console.log('About to delete all caches...');
    deleteAllCaches().then(function() {
      console.log('Caches deleted.');
      event.ports[0].postMessage({
        error: null
      });
    }).catch(function(error) {
      console.log('Caches not deleted:', error);
      event.ports[0].postMessage({
        error: error
      });
    });
  }
});


function cachesMatchForPrefix(request, opts) {
  return caches.keys().then(function(cacheNames) {
    var match;

    return cacheNames.reduce(function(chain, cacheName) {
      return chain.then(function() {
        if (match) {
          return match;
        }

        if (cacheName.indexOf(CacheNamePrefix) != 0) {
          return;
        }

        return caches.open(cacheName).then(function(cache) {
          return cache.match(request, opts);
        }).then(function(response) {
          match = response;
          return match;
        });
      });
    }, Promise.resolve());
  });
}

self.addEventListener('fetch', function(event) {
  if (event.request.method == 'GET') {
    // This check limits this fetch handler so that it only intercepts traffic for one
    // of the URLs we're explicitly pre-caching. It opens the door for other fetch
    // handlers (such as those registered via importScripts()) to handle other network traffic.
    var isRequestForPrecachedUrl = PrecacheConfig.some(function(cacheOption) {
      // The URLs in PrecacheConfig are all relative to the project root. Constructing a new URL()
      // and using the service worker's location as the base should result in a valid absolute URL.
      // (Using case-sensitive string comparisons of the absolute URLs isn't ideal, though.)
      return new URL(cacheOption[0], self.location).toString() == event.request.url;
    });

    if (isRequestForPrecachedUrl) {
      event.respondWith(
        cachesMatchForPrefix(event.request).then(function(response) {
          return response || fetch(event.request);
        })
      );
    }
  }
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

