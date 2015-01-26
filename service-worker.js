'use strict';



var PrecacheConfig = [["./","1ce2bf017dea092b4739c8bb25a522e9"],["css/main.css","3cb4f06fd9e705bea97eb1bece31fd6d"],["dynamic/page1","7ea130186a1087177c3f587e510709c3"],["dynamic/page2","cf458509f6e510a24c0e9f7245337cd4"],["images/one.png","c5a951f965e6810d7b65615ee0d15053"],["images/two.png","29d2cd301ed1e5497e12cafee35a0188"],["index.html","871f68dd27ed9049a7db80bb02b2689a"],["js/a.js","abcb1c5b4c6752aed90979fb3b6cf77a"],["js/b.js","d8e5842f1710f6f4f8fe2fe322a73ade"],["js/service-worker-registration.js","ba1f2388a0fa13d141c1d96d49d47590"]];
var CacheNamePrefix = 'sw-precache-v1-sw-precache-' + (self.registration ? self.registration.scope : '') + '-';
var AbsoluteUrlToCacheName;
var CurrentCacheNamesToAbsoluteUrl;
populateCurrentCacheNames(PrecacheConfig, CacheNamePrefix);


var IgnoreUrlParametersMatching = [/^utm_/];


function getCacheNameFromCacheOption(cacheOption) {
  return CacheNamePrefix + cacheOption[0] + '-' + cacheOption[1];
}

function populateCurrentCacheNames(precacheConfig, cacheNamePrefix) {
  AbsoluteUrlToCacheName = {};
  CurrentCacheNamesToAbsoluteUrl = {};

  precacheConfig.forEach(function(cacheOption) {
    var absoluteUrl = new URL(cacheOption[0], self.location).toString();
    var cacheName = CacheNamePrefix + absoluteUrl + '-' + cacheOption[1];
    CurrentCacheNamesToAbsoluteUrl[cacheName] = absoluteUrl;
    AbsoluteUrlToCacheName[absoluteUrl] = cacheName;
  });
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
        Object.keys(CurrentCacheNamesToAbsoluteUrl).filter(function(cacheName) {
          return allCacheNames.indexOf(cacheName) == -1;
        }).map(function(cacheName) {
          var url = CurrentCacheNamesToAbsoluteUrl[cacheName];
          console.log('Adding URL "%s" to cache named "%s"', url, cacheName);
          return caches.open(cacheName).then(function(cache) {
            return cache.add(new Request(url, {credentials: 'same-origin'}));
          });
        })
      ).then(function() {
        return Promise.all(
          allCacheNames.filter(function(cacheName) {
            return cacheName.indexOf(CacheNamePrefix) == 0 &&
                   !(cacheName in CurrentCacheNamesToAbsoluteUrl);
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


function stripIgnoredUrlParameters(originalUrl, ignoreUrlParametersMatching) {
  var url = new URL(originalUrl);

  url.search = url.search.slice(1) // Exclude initial '?'
    .split('&') // Split into an array of 'key=value' strings
    .map(function(kv) {
      return kv.split('='); // Split each 'key=value' string into a [key, value] array
    })
    .filter(function(kv) {
      return ignoreUrlParametersMatching.every(function(ignoredRegex) {
        return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
      });
    })
    .map(function(kv) {
      return kv.join('='); // Join each [key, value] array into a 'key=value' string
    })
    .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

  return url.toString();
}

self.addEventListener('fetch', function(event) {
  if (event.request.method == 'GET') {
    var urlWithoutIgnoredParameters = stripIgnoredUrlParameters(event.request.url,
      IgnoreUrlParametersMatching);

    var cacheName = AbsoluteUrlToCacheName[urlWithoutIgnoredParameters];
    if (cacheName) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlWithoutIgnoredParameters).then(function(response) {
            return response || fetch(event.request).catch(function(e) {
              console.error('Fetch for "%s" failed: %O', urlWithoutIgnoredParameters, e);
            });
          });
        }).catch(function(e) {
          console.error('Couldn\'t serve response for "%s" from cache: %O', urlWithoutIgnoredParameters, e);
          return fetch(event.request);
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

