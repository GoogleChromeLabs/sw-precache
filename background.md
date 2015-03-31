# tl;dr
This project is an exploration into integrating service worker-based caching patterns into  [`gulp`](http://gulpjs.com/) or [`grunt`](http://gruntjs.com/) build scripts. If you have a website, adding in offline-first support should be as easy as adding some additional logic to your build process.

### What's all this, then?
[Service workers](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html) give JavaScript developers almost complete control over a browser's network stack. There are a number of [patterns](http://jakearchibald.com/2014/offline-cookbook/) around offline use cases, and one of the most useful is [cache on install as a dependency](http://jakearchibald.com/2014/offline-cookbook/#on-install-as-a-dependency). The first time a user visits your page using a browser that supports service workers, all of the resources needed to use the page offline can be automatically cached locally, and each subsequent visit to any page on the site will be a) fast (since there's no network dependency) and b) work offline (for the same reason).

### Great! As a developer, what do I have to do?
Here's a code snippet from [@jakearchibald](https://github.com/jakearchibald)'s post describing [cache on install as a dependency](http://jakearchibald.com/2014/offline-cookbook/#on-install-as-a-dependency):

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

(**Update**: The code has recently been refactored to be a standalone node module, with the goal of making the output work equally well as part of a `gulp` or `grunt` build process.)

### How's it all work?

Inside the sample [`gulpfile.js`](https://github.com/googlechrome/gulp-sw-precache/blob/master/demo/gulpfile.js), there's a list of [glob patterns](https://github.com/isaacs/node-glob) corresponding to static files, as well as a mapping of server-generated resource URLs to the component files that are used to generated that URL's output:

    dynamicUrlToDependencies: {
      'dynamic/page1': [rootDir + '/views/layout.jade', rootDir + '/views/page1.jade'],
      'dynamic/page2': [rootDir + '/views/layout.jade', rootDir + '/views/page2.jade']
    },
    staticFileGlobs: [
      rootDir + '/css/**.css',
      rootDir + '/**.html',
      rootDir + '/images/**.*',
      rootDir + '/js/**.js'
    ],

For each of those entries, there's code to expand the glob pattern and calculate the [MD5 hash](http://en.wikipedia.org/wiki/MD5) of the contents of each file. The MD5 hash along with the file's relative path is used to uniquely name the [cache](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cache-objects) entry that will be used to store that resource. If the process runs again and an existing file's contents change, or a new file is added or an existing file is deleted, those changes will result in a different list of cache names being generated. Conversely, if the process runs agains and every file is exactly the same as last time, then the same MD5 hashes and names *should* be generated, and the service worker won't attempt to update anything.

Regardless of what files we're working with, most of the logic stays the same—there's an `install` handler that caches anything that isn't already present in the cache (using the `hash` to determine whether the exact version of each resource is present or not), and an `activate` handler that takes care of deleting old caches that we no longer need. There's also a `fetch` handler that attempst to serve each response from the cache, falling back to the network only if a given resource URL isn't present.

### Try it out!
Clone this repo, run `npm install`, and then `gulp serve-dist`. Take a look at the contents of the generated `dist` directory. Go to `http://localhost:3000` using Chrome 40 or newer (I prefer testing using [Chrome Canary](https://www.google.com/chrome/browser/canary.html)). Visit `chrome://serviceworker-internals` and check out the logged activity for the registered service worker, as well as the service worker cache inspector.

Try changing some files in `dist` and then running `gulp generate-service-worker-dist` to generate a new `dist/service-worker.js` file, then close and re-open `http://localhost:3000`. Examine the logging via `chrome://serviceworker-internals` and notice how the service worker cache inspector has updated to include the latest set named caches.

### Feedback, please!
There are a lot of `TODO`s in the code where I've hacked something together that seems to work, but given my rather limited experience working with node modules, may not be the right approach. I'd love to hear suggestions about improving that. And in general, let me know if this seems like something you'd find useful (or if you even do actually start using it)!
