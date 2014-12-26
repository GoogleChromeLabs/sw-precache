# tl;dr
This project is an exploration into integrating service worker-based caching patterns into  [`gulp`](http://gulpjs.com/) build scripts. If you have a website, adding in offline-first support should be as easy as adding some additional logic to your `gulp` build process.

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

Eventually, it may make sense to refactor this out as a standalone `gulp` plugin, or incorporate the logic into the [Web Starter Kit](https://developers.google.com/web/starter-kit/) or [Yeoman](http://yeoman.io/). For the time being, if you wanted to use this in your own project, extracting the logic out of  [`gulpfile.js`](https://github.com/jeffposnick/gulp-sw-precache/blob/master/gulpfile.js) and including a local copy of the [helper files](https://github.com/jeffposnick/gulp-sw-precache/tree/master/service-worker-helpers) is necessary.

### How's it all work?

Inside the [`gulpfile.js`](https://github.com/jeffposnick/gulp-sw-precache/blob/master/gulpfile.js), there's a mapping of multiple identifiers to [glob patterns](https://github.com/isaacs/node-glob), like so:

    var fileSets = {
      css: DIST_DIR + '/css/**.css',
      html: DIST_DIR + '/**.html',
      images: DIST_DIR + '/images/**.*',
      js: DIST_DIR + '/js/**.js'
    };

For each of those entries, there's code to expand the glob pattern and calculate the [MD5 hash](http://en.wikipedia.org/wiki/MD5) of the contents of each file. The list of MD5 hashes (as hex strings) are then sorted and concatenated, and the MD5 hash of that string is generated. For each entry, we end up with an array consisting of the identifier (e.g. `css`), the list of files (e.g. `['css/main.css', 'css/fonts.css']`), and an MD5 hash that (semi-)uniquely identifies the contents of each of the files (e.g. `'e4d909...'`). If the process runs again and an existing file's contents change, or a new file is added or an existing file is deleted, then a new MD5 hash *should* be generated. Conversely, if the process runs agains and every file that matches the glob pattern is exactly the same as last time, then the same MD5 hash *should* be generated.

Once this process is complete for each entry, we write out the resulting array of [`identifier`, `file_list`, `hash`] arrays to a [template](https://github.com/jeffposnick/gulp-sw-precache/blob/master/service-worker-helpers/service-worker.tmpl) that contains the logic behind the service worker. The combination of `identifier` + `hash` is used as the cache name (with `hash` taking the place of a monotonically increasing version number).

Regardless of what files we're working with, most of the logic stays the same—there's an `install` handler that caches anything that isn't already present in the cache (using the `hash` to determine whether the exact contents of each file set is present or not), and an `activate` handler that takes care of deleting old caches that we no longer need. There's also a `fetch` handler that attempst to serve each response from the cache, falling back to the network only if a given resource URL isn't present.

There are a few other [helper files](https://github.com/jeffposnick/gulp-sw-precache/tree/master/service-worker-helpers) included in this project—a [polyfill](https://github.com/jeffposnick/gulp-sw-precache/blob/master/service-worker-helpers/service-worker-cache-polyfill.js) that's needed to provide some advanced cache functionality in Chrome 40, and a [small script](https://github.com/jeffposnick/gulp-sw-precache/blob/master/service-worker-helpers/service-worker-registration.js) to handle service worker registration.
