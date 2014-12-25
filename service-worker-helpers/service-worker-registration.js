'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', {scope: './'}).catch(function() {
    // Ignore the fact that we can't register the service worker due to a missing
    // service-worker.js file when served from app/.
  });
}
