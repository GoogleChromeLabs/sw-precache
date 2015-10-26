/* eslint-env browser */
(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
      registration.onupdatefound = function() {
        var installingWorker = registration.installing;
        installingWorker.onstatechange = function() {
          switch (installingWorker.state) {
            case 'installed':
              if (navigator.serviceWorker.controller) {
                console.log('New or updated content is available.');
              } else {
                console.log('Content is now available offline!');
              }
              break;

            case 'redundant':
              console.error('The installing service worker became redundant.');
              break;
          }
        };
      };
    }).catch(function(error) {
      console.error('Error during service worker registration:', error);
    });
  }
})();
