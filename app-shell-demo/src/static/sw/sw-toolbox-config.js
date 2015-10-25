/* eslint-env worker,serviceworker */
(global => {
  'use strict';

  // API responses are served from a base of https://www.ifixit.com/api/2.0/
  // Since they might change, but freshness isn't of the utmost importance,
  // the 'fastest' strategy can be used.
  global.toolbox.router.get('/api/2.0/(.*)', global.toolbox.fastest, {
    origin: /^https:\/\/www.ifixit.com$/
  });

  const MISSING_IMAGE = '/images/missing.png';
  global.toolbox.precache(MISSING_IMAGE);

  function imageHandler(request, values, options) {
    return global.toolbox.cacheFirst(request, values, options).catch(() => {
      return global.caches.match(MISSING_IMAGE);
    });
  }

  // Static images are served from a subdomain of cloudfront.net.
  global.toolbox.router.get('/(.*)', imageHandler, {
    cache: {
      name: 'image-cache',
      maxEntries: 50
    },
    origin: /cloudfront.net$/
  });
})(self);
