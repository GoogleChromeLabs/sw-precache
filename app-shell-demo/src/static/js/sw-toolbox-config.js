(global => {
  'use strict';

  // API responses are served from a base of https://www.ifixit.com/api/2.0/
  // Since they might change, but freshness isn't of the utmost importance,
  // the 'fastest' strategy can be used.
  global.toolbox.router.get('/api/2.0/(.*)', global.toolbox.fastest, {
    origin: /^https:\/\/www.ifixit.com$/
  });

  // Static images are served from a subdomain of cloudfront.net.
  // Since they're unlikely to change, the 'cacheFirst' strategy can be used, along with a custom
  // cache expiration to ensure our cache doesn't grow indefinitely.
  global.toolbox.router.get('/(.*)', global.toolbox.cacheFirst, {
    cache: {
      name: 'image-cache',
      // Store up to 2 entries in that cache.
      maxEntries: 2
    },
    origin: /cloudfront.net$/
  });
})(self);
