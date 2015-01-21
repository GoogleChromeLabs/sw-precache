'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', {
    scope: './'
  }).then(function(registration) {
    // updatefound is fired if service-worker.js changes.
    registration.onupdatefound = function() {
      // updatefound is also fired the very first time the SW is installed, and there's no need to
      // prompt for a reload at that point. So check here to see if the page is already controlled,
      // i.e. whether there's an existing service worker.
      if (navigator.serviceWorker.controller) {
        // The updatefound event implies that registration.installing is set; see
        // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
        var installingWorker = registration.installing;

        installingWorker.onstatechange = function() {
          switch (installingWorker.state) {
            case 'installed':
              // At this point, the old content will have been purged and the fresh content will
              // have been added to the cache.
              // It's the perfect time to display a "New content is available; please refresh."
              // message in the page's interface.
            break;

            case 'redundant':
              throw 'The installing service worker became redundant.';
          }
        };
      }
    };
  }).catch(function(e) {
    console.error('Error during service worker registration:', e);
  });
}
