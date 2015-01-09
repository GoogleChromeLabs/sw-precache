'use strict';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', {scope: './'}).catch(function(e) {
    console.error('Unable to register service worker:', e);
  });
}
