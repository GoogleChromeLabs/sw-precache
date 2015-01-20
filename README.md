#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

> Generate service worker code that will precache specific resources.
See the [background doc](background.md) for more information.


## Install

```sh
$ npm install --save-dev sw-precache
```


## Usage

`sw-precache` is meant to be incorporated into your site's build process. It exposes a standard
callback-based interface and is compatibile with [`gulp`](http://gulpjs.com/),
[`Grunt`](http://gruntjs.com/), or other node-based build tools.

The project's [sample `gulpfile.js`](https://github.com/jeffposnick/sw-precache/blob/master/demo/gulpfile.js)
illustrates its usage in context; it will use `sw-precache` to generate valid JavaScript code and
then write it to a local directory as `service-worker.js`.

**Important**: Generating the `service-worker.js` is only one step in implementing precaching. You
**must** call
[`navigator.serviceWorker.register()`](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#navigator-service-worker-register)
to register `service-worker.js` as the service worker that controls your pages; otherwise, it will
never execute.
You load a local copy of the
[`service-worker-registration.js`](https://github.com/jeffposnick/sw-precache/blob/master/demo/app/js/service-worker-registration.js)
script within your pages to handle this for you; in practice, this means adding

    <script src="path/to/service-worker-registration.js"></script>

somewhere within your HTML. The demo
[`index.html`](https://github.com/jeffposnick/sw-precache/blob/master/demo/app/index.html) file
contains an example.


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

Apache 2.0

© 2015 Google Inc.

[npm-url]: https://npmjs.org/package/sw-precache
[npm-image]: https://badge.fury.io/js/sw-precache.svg
[travis-url]: https://travis-ci.org/jeffposnick/sw-precache
[travis-image]: https://travis-ci.org/jeffposnick/sw-precache.svg?branch=master
[daviddm-url]: https://david-dm.org/jeffposnick/sw-precache.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/jeffposnick/sw-precache
