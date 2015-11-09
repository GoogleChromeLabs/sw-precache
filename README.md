#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

# Service Worker Precache

> Precache specific resources

Service Worker Precache generates service worker code that precaches specific resources.
See the [background doc](background.md) for more information.


## Install

Local build integration:
```sh
$ npm install --save-dev sw-precache
```

Global command-line interface:
```sh
$ npm install --global sw-precache
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
take care of precaching and fetching all the resources your site needs to function offline. There
is also a [command-line interface](#command-line-interface) available, for those using alternate
build setups.

3. **Register the service worker JavaScript.**
The JavaScript that's generated needs to be registered as the controlling service worker for your
pages. This technically only needs to be done from within a top-level "entry" page for your site,
since the registration includes a
[`scope`](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-registration-scope)
which will apply to all pages underneath your top-level page.
[`service-worker-registration.js`](https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js)
is a sample script that illustrates the best practices for registering the generated service worker
code and handling the various
[lifecycle](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-state.1) events.

### Example

The project's [sample `gulpfile.js`](https://github.com/googlechrome/sw-precache/blob/master/demo/gulpfile.js)
illustrates its full usage in context. You can run the sample by cloning this repo,
using [`npm install`](https://docs.npmjs.com/) to pull in the dependencies, changing to the
`demo` directory, running `gulp serve-dist`, and then visiting http://localhost:3000

There is also a [basic `Gruntfile.js`](https://github.com/googlechrome/sw-precache/blob/master/demo/Gruntfile.js)
provided as a sample.

Here's a simpler example for a basic use case. It assumes your site's resources are located under
`app` and that you'd like to cache *all* your JavaScript, HTML, CSS, and image files.

    gulp.task('generate-service-worker', function(callback) {
      var path = require('path');
      var swPrecache = require('sw-precache');
      var rootDir = 'app';

      swPrecache.write(path.join(rootDir, 'service-worker.js'), {
        staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif}'],
        stripPrefix: rootDir
      }, callback);
    });

This task will create `app/service-worker.js`, which you'll need to
[register](https://slightlyoff.github.io/ServiceWorker/spec/service_worker/#navigator-service-worker-register)
before it can take control of your site's pages.
[`service-worker-registration.js`](https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js)
is a ready-to-use script to handle registration.


### Considerations

- Service worker caching should be considered a progressive enhancement. If you follow the model of
conditionally registering a service worker only if it's supported (determined by
`if('serviceWorker' in navigator)`), you'll get offline support on browsers with service workers and
on browsers that don't support service workers, the offline-specific code will never be called.
There's no overhead/breakage for older browsers if you add `sw-precache` to your build.

- **All** resources that are precached will be fetched by a service worker running in a separate
thread as soon as the service worker is installed. You should be judicious in what you list in the
`dynamicUrlToDependencies` and `staticFileGlobs` options, since listing files that are non-essential
(large images that are not shown on every page, for instance) will result in browsers downloading
more data then is strictly necessary, as soon as they visit your site.

- Precaching doesn't make sense for all types of resources (see previous point). Other caching
strategies, like those outlined in the [offline cookbook](http://jakearchibald.com/2014/offline-cookbook/),
can be used in conjunction with `sw-precache` to provide the best experience for your users. If you
do implement additional caching logic, put the code in a separate JavaScript file and include it
using the `importScripts` option.

- `sw-precache` uses a [cache-first](http://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network)
strategy, which results in a copy of any cached content being returned without consulting the
network. A useful pattern to adopt is to display a toast/alert to your users when there's new
content available, and give them an opportunity to reload the page to pick up that new content
(which the service worker will have  added to the cache, and will be available at the next page
load). The sample service-worker-registration.js file
[illustrates](https://github.com/GoogleChrome/sw-precache/blob/7688ee8ccdaddd9171af352384d04d16d712f9d3/demo/app/js/service-worker-registration.js#L51)
the service worker lifecycle event you can listen for to trigger this message.


### Command-line interface

For those who would prefer not to use `sw-precache` as part of a `gulp` or `Grunt` build, there's a
[command-line interface](cli.js) which supports all the same options, provided via flags. Sensible
defaults are assumed for options that are not provided.

For example, if you are inside the top-level directory that contains your site's contents, and you'd
like to generate a `service-worker.js` file that will automatically precache all of the local
files, you can simply run

```sh
$ sw-precache
```

Alternatively, if you'd like to only precache `.html` files that live within `dist/`, which is a
subdirectory of the current directory, you could run

```sh
$ sw-precache --root=dist --static-file-globs='dist/**/*.html'
```
 
(Be sure to use quotes around parameter values, like `*`, that have special meanings to your shell.)

## API

### Methods

The `sw-precache` module exposes two methods: `generate` and `write`.

#### generate(options, callback)
`generate` takes in [options](#options), generates resulting service worker code as a string, and
then invokes `callback(error, serviceWorkerString)`.
In the 1.x releases of `sw-precache`, this was the default and only method exposed by the module.

Since 2.2.0, `generate()` also returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

#### write(filePath, options, callback)
`write` is a helper method that calls `generate` and takes the resulting string content and
writes it to disk, at `filePath`. It then invokes `callback(error)`.

Since 2.2.0, `write()` also returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

### Options Parameter

Both the `generate()` and `write()` methods take the same options.

#### cacheId [String]
A string used to distinguish the caches created by different web applications that are served off
of the same origin and path. While serving completely different sites from the same URL is not
likely to be an issue in a production environment, it avoids cache-conflicts when testing various
projects all served off of `http://localhost`. You may want to set it to, e.g., the `name`
property from your `package.json`.

Default: `''`

#### directoryIndex [String]
Many web servers automatically treat a URL corresponding to a directory (i.e. ending in `'/'`) as
if it were a request for a specific index file in that directory, traditionally `'index.html'`.
`sw-precache` will take that translation into account and serve the contents a relative
`directoryIndex` file when there's no other match for a URL ending in `'/'`.
To turn off this behavior, set `directoryIndex` to `false` or `null`.
To override this behavior for one or more URLs, use the `dynamicUrlToDependencies` option to
explicitly set up mappings between a directory URL and the corresponding file to use.

Default: `'index.html'`

#### dynamicUrlToDependencies [Object&#x27e8;String,Array&#x27e8;String&#x27e9;&#x27e9;]
Maps a dynamic URL string to an array of all the files that URL's contents depend on.
E.g., if the contents of `/pages/home` are generated server-side via the templates `layout.jade` and
`home.jade`, then specify `'/pages/home': ['layout.jade', 'home.jade']`. The MD5 hash used to
determine whether `/pages/home` has changed will depend on the hashes of both
`layout.jade` and `home.jade`.

Default: `{}`

#### handleFetch [boolean]
Determines whether the `fetch` event handler is included in the generated service worker code.
It is useful to set this to `false` in development builds, to ensure that features like live reload
still work (otherwise, the content would always be served from the service worker cache).

Default: `true`

#### ignoreUrlParametersMatching [Array&#x27e8;Regex&#x27e9;]
`sw-precache` finds matching cache entries by doing a comparison with the full request URL. It's
common for sites to support URL query parameters that don't affect the site's content and should
be effectively ignored for the purposes of cache matching—one example is the
[`utm_`-prefixed](https://support.google.com/analytics/answer/1033867) parameters used for tracking
campaign performance. By default, `sw-precache` will ignore `key=value` when `key` matches _any_ of
the regular expressions provided in this option.
To ignore all parameters, use `[/./]`. To take all parameters into account when matching, use `[]`.

Default: `[/^utm_/]`

#### importScripts [Array&#x27e8;String&#x27e9;]
If you'd like to include one or more external scripts as part of the generated service worker code,
use this option. The scripts passed in will be passed directly to the
[`importScripts()`](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/basic_usage#Importing_scripts_and_libraries)
method.

Default: `[]`

#### logger [function]
A function used to report back on which resources are being precached (if `verbose` is `true`)
and the overall precache size.
Use `function() {}` if you'd prefer that nothing is logged.
Within a `gulp` script, it's recommended that you use
[`gulp-util`](https://github.com/gulpjs/gulp-util) and pass in `gutil.log`.

Default: `console.log`

#### maximumFileSizeToCacheInBytes [Number]
Files larger than this size will not be added to the precache list.

Default: `2097152` (2 megabytes)

#### navigateFallback [String]
If set, then a request for an HTML document whose URL doesn't otherwise match any cached entries
will be treated as if it were a request for the `navigateFallback` value, relative to the URL that
the service worker is served from. To be effective, this fallback URL should be already cached via
`staticFileGlobs` or `dynamicUrlToDependencies`.

This comes in handy when used with a web application that performs client-side URL routing
using the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History). It allows any
arbitrary URL that the client generates to map to a fallback cached HTML entry. This fallback entry
ideally should serve as an "application shell" that is able to load the appropriate resources
client-side, based on the request URL.

**Note**: The current implementation checks `event.request.headers.get('accept').includes('text/html')`
to determine whether to trigger the fallback, which will be `true` for any request made for an
HTML document, whether it's a navigation or not. Once it's more
[widely](https://code.google.com/p/chromium/issues/detail?id=540967)
[supported](https://bugzilla.mozilla.org/show_bug.cgi?id=1209081), the logic will be changed to
check for `event.request.mode === 'navigate'`.

Default: `''`

#### stripPrefix [String]
Useful when there's a discrepancy between the relative path to a local file at build time and the
relative URL that the resource will be served from.
E.g. if all your local files are under `dist/app/` and your web root is also at `dist/app/`, you'd
strip that prefix from the start of each local file's path in order to get the correct relative URL.

Default: `''`

#### replacePrefix [String]
Useful when you are using stripPrefix to remove some portion of the url, but instead of just removing it,
need a replacement string to be used instead. Use this option if you are serving statics from a different directory.
E.g. if all your local files are under `dist/app/` but your static asset root is at `/public/`, you'd
strip 'dist/app/' and replace it with '/public/' in order to get the correct URL for the web.

Default: `''`

#### staticFileGlobs [Array&#x27e8;String&#x27e9;]
An array of one or more string patterns that will be passed in to
[`glob`](https://github.com/isaacs/node-glob).
All files matching these globs will be automatically precached by the generated service worker.
You'll almost always want to specify something for this.

Default: `[]`

#### templateFilePath [String]
The path to the file used as the ([lo-dash](https://lodash.com/docs#template)) template to generate
`service-worker.js`.
If you need to add in additional functionality to the generated service worker code, it's
recommended that you use the `importScripts` option to include in extra JavaScript code rather than
using a different template.
But if you do need to change the basic generated service worker code, please make a copy of the
[original template](https://github.com/googlechrome/sw-precache/blob/master/service-worker.tmpl),
modify it locally, and use this option to point to your template file.

Default: `service-worker.tmpl` (in the directory that this module lives in)

#### verbose [boolean]
Determines whether there's log output for each individual static/dynamic resource that's precached.
Even if this is set to false, there will be a final log entry indicating the total size of all
precached resources.

Default: `false`


## Acknowledgements

Thanks to [Sindre Sorhus](https://github.com/sindresorhus) and
[Addy Osmani](https://github.com/addyosmani) for their advice and code reviews.
[Jake Archibald](https://github.com/jakearchibald) was kind enough to review the service worker logic.


## License

[Apache 2.0](https://github.com/googlechrome/sw-precache/blob/master/LICENSE) © 2015 Google Inc.

Copyright 2015 Google, Inc.

Licensed under the [Apache License, Version 2.0](LICENSE) (the "License"); 
you may not use this file except in compliance with the License. You may 
obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[npm-url]: https://npmjs.org/package/sw-precache
[npm-image]: https://badge.fury.io/js/sw-precache.svg
[travis-url]: https://travis-ci.org/GoogleChrome/sw-precache
[travis-image]: https://travis-ci.org/GoogleChrome/sw-precache.svg?branch=master
[daviddm-url]: https://david-dm.org/googlechrome/sw-precache.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/googlechrome/sw-precache
