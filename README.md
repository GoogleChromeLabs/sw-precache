#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

> Generate service worker code that will precache specific resources.
See the [background doc](background.md) for more information.


## Install

```sh
$ npm install --save-dev sw-precache
```


## Usage

### Overview

1. **Make sure your site is served using HTTPS!**
Service worker functionality is only available on pages that are accessed via HTTPS.
(`http://localhost` will also work, to facilitate testing.) The rationale for this restriction is
outlined in the
["Prefer Secure Origins For Powerful New Features" document](http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features).

2. **Incorporate `sw-precache` into your `node`-based build script.**
It should work well with either `gulp` or `Grunt`, or other build scripts that run on `node`.
As part of the build process, `sw-precache` generates fully functional JavaScript code that will
take care of precaching and fetching all the resources your site needs to function offline.

3. **Register the service worker JavaScript.**
The JavaScript that's generated needs to be registered as the controlling service worker for your
pages. This technically only needs to be done from within a top-level "entry" page for your site,
since the registration includes a
[`scope`](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-registration-scope)
which will apply to all pages underneath your top-level page.
[`service-worker-registration.js`](https://github.com/jeffposnick/sw-precache/blob/master/demo/app/js/service-worker-registration.js)
is a sample script that illustrates the best practices for registering the generated service worker
code and handling the various
[lifecycle](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-state.1) events.

### Example

The project's [sample `gulpfile.js`](https://github.com/jeffposnick/sw-precache/blob/master/demo/gulpfile.js)
illustrates its usage in context; it will use `sw-precache` to generate valid JavaScript code and
then write it to a local directory as `service-worker.js`. Here's an excerpt:

    var config = {
      dynamicUrlToDependencies: {
        './': [path.join(rootDir, 'index.html')],
        'dynamic/page1': [
          path.join(rootDir, 'views', 'layout.jade'),
          path.join(rootDir, 'views', 'page1.jade')
        ],
        'dynamic/page2': [
          path.join(rootDir, 'views', 'layout.jade'),
          path.join(rootDir, 'views', 'page2.jade')
        ]
      },
      handleFetch: handleFetch,
      logger: $.util.log,
      staticFileGlobs: [
        rootDir + '/css/**.css',
        rootDir + '/**.html',
        rootDir + '/images/**.*',
        rootDir + '/js/**.js'
      ],
      stripPrefix: path.join(rootDir, path.sep)
    };

    swPrecache(config, callback);


## Options

### dynamicUrlToDependencies [`Object<String,Array<String>>`]
Maps a dynamic URL string to an array of all the files that URL's contents depend on.
E.g., if the contents of `/pages/home` are generated server-side via the templates `layout.jade` and
`home.jade`, then specify `'/pages/home': ['layout.jade', 'home.jade']`. The MD5 hash used to
determine whether `/pages/home` has changed will depend on the hashes of both
`layout.jade` and `home.jade`.

Default: `{}`

### handleFetch [`boolean`]
Determines whether the `fetch` event handler is included in the generated service worker code.
It is useful to set this to `false` in development builds, to ensure that features like live reload
still work (otherwise, the content would always be served from the service worker cache).

Default: `true`

### importScripts [`Array<String>`]
If you'd like to include one or more external scripts as part of the generated service worker code,
use this option. The scripts passed in will be passed directly to the
[`importScripts()`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/basic_usage#Importing_scripts_and_libraries)
method.

Default: `[]`

### includeCachePolyfill [`boolean`]
Whether or not to include the
[service worker cache polyfill](https://github.com/coonsta/cache-polyfill/blob/master/dist/serviceworker-cache-polyfill.js), which provides a JavaScript
implementation of some functionality that is not yet found in Chrome 41.
Unless you know that you're already including this elsewhere in your project, it's a good idea to
leave as-is.

Default: `true`

### logger [`function`]
A function used to report back on which resources are being precached and the overall size.
Use `function() {}` if you'd prefer that nothing is logged.
Within a `gulp` script, it's recommended that you use
[`gulp-util`](https://github.com/gulpjs/gulp-util) and pass in `gutil.log`.

Default: `console.log`

### maximumFileSizeToCacheInBytes [`Number`]
Files larger than this size will not be added to the precache list.

Default: `4194304` (2 megabytes)

### stripPrefix [`String`]
Useful when there's a discrepency between the relative path to a local file at build time and the
relative URL that the resource will be served from.
E.g. if all your local files are under `dist/app/` and your web root is also at `dist/app/`, you'd
strip that prefix from the start of each local file's path in order to get the correct relative URL.

Default: `''`

### staticFileGlobs [`Array<String>`]
An array of one or more string patterns that will be passed in to
[`glob`](https://github.com/isaacs/node-glob).
All files matching these globs will be automatically precached by the generated service worker.
You'll almost always want to specify something for this.

Default: `[]`

### templateFilePath [`String`]
The path to the file used as the ([lo-dash](https://lodash.com/docs#template)) template to generate
`service-worker.js`.
If you need to add in additional functionality to the generated service worker code, it's
recommended that you use the `importScripts` option to include in extra JavaScript code rather than
using a different template.
But if you do need to change the basic generated service worker code, please make a copy of the
[original template](https://github.com/jeffposnick/sw-precache/blob/master/service-worker.tmpl),
modify it locally, and use this option to point to your template file.

Default: `service-worker.tmpl` (in the directory that this module lives in)


## Acknowledgements

Thanks to [Sindre Sorhus](https://github.com/sindresorhus) and
[Addy Osmani](https://github.com/addyosmani) for their advice and code reviews.


## License

[Apache 2.0](https://github.com/jeffposnick/sw-precache/blob/master/LICENSE) © 2015 Google Inc.

[npm-url]: https://npmjs.org/package/sw-precache
[npm-image]: https://badge.fury.io/js/sw-precache.svg
[travis-url]: https://travis-ci.org/jeffposnick/sw-precache
[travis-image]: https://travis-ci.org/jeffposnick/sw-precache.svg?branch=master
[daviddm-url]: https://david-dm.org/jeffposnick/sw-precache.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/jeffposnick/sw-precache
