# tl;dr
This project is an exploration into integrating service worker-based caching patterns into  [`gulp`](http://gulpjs.com/) build scripts.

### What's all this, then?
[Service workers](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html) give JavaScript developers almost complete control over a browser's network stack. There are a number of [patterns](http://jakearchibald.com/2014/offline-cookbook/) around offline use cases, and one of the most useful is [cache on install as a dependency](http://jakearchibald.com/2014/offline-cookbook/#on-install-as-a-dependency). The first time a user visits your page using a browser that supports service workers, all of the resources needed to use the page offline can be automatically cached locally, and each subsequent visit to any page on the site will be a) fast (since there's no network dependency) and b) work offline (for the same reason).

### Great! As a developer, what do I have to do?
Here's a code snippet from [@jakearchibald](https://github.com/jakearchibald)'s post describing [cache on install as a dependency](http://jakearchibald.com/2014/offline-cookbook/#on-install-as-a-dependency)

    self.addEventListener('install', function(event) {
      event.waitUntil(
        caches.open('mysite-static-v3').then(function(cache) {
          return cache.addAll([
            '/css/whatever-v3.css',
            '/css/imgs/sprites-v6.png',
            '/css/fonts/whatever-v8.woff',
            '/js/all-min-v4.js'
            // etc
          ]);
        })
      );
    });
    
There are two difficulties here that someone implementing this pattern with a real site would face:

- `mysite-static-v3` represents the name of the [cache](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cache-objects) that will store and serve the resources, and in particular, `v3` represents the unique version that's "current" for your site. As a developer, how do you handle cache versioning—what if you forget to bump up the version number for each of your named caches, and existing users of your site never pick up the changes to the cached resources that you meant to deploy?

- There's a small list of resources, followed by an `// etc`. For a site of any significant size, that `// etc` contains multitudes. What if you forget to add in that additional image, or forgot to switch in the latest version of your minified JavaScript?

### So what does this project aim to do?
Versioning and generating lists of local files are both solved problems, and `gulp` in particular (which you're hopefully using already as part of your build tooling) is ideal for that purpose. What's missing is something to tie the things that `gulp` can do in with the service worker logic to ensure that your cache versioning is always correct, and your lists of resources for each cache are always up to date. This project is an exploration of one approach to automating that process.
