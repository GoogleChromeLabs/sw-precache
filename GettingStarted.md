# Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Why Should I Use a Service Worker?](#why-should-i-use-a-service-worker)
- [Terminology](#terminology)
  - [Service Worker](#service-worker)
  - [App Shell](#app-shell)
  - [Dynamic Content](#dynamic-content)
  - [Caching Strategy](#caching-strategy)
- [Add `sw-precache` to Your Build](#add-sw-precache-to-your-build)
  - [Automation](#automation)
  - [Configuration](#configuration)
    - [Basic](#basic)
    - [Runtime Caching for Dynamic Content](#runtime-caching-for-dynamic-content)
    - [Server-side Templating](#server-side-templating)
    - [Fallback URL](#fallback-url)
- [Examples](#examples)
- [Other Resources](#other-resources)
  - [Articles](#articles)
  - [Videos](#videos)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Why Should I Use a Service Worker?

You have a web app, and you'd like it to load quickly and work offline.

You'd like to use proven tools to handle the details for you, to work around
common gotchas and follow best practices.

# Terminology

## Service Worker

A [service worker](http://www.html5rocks.com/en/tutorials/service-worker/introduction/)
is a background script that intercepts network requests made by your web app.
It can use the [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
to respond to those requests.

You do not have to write your own service worker script; this guide will explain
how to generate one customized for your web app.

## App Shell

"App Shell" refers to the local resources that your web app needs to load its
basic structure. This will always include some HTML, and will likely also
include CSS and JavaScript, either inline or in external files.

Some static web apps consist entirely of an App Shell.

A helpful analogy is to think of your App Shell as the code and resources that
would be published to an app store for a native iOS or Android application.

The App Shell should ideally be loaded directly from the local cache, just like
a native iOS or Android application is loaded directly from a device's storage.

## Dynamic Content

The dynamic content is all of the data, images, and other resources that your
web app needs to function, but exists independently from your App Shell.

Sometimes this data will come from external, third-party APIs, and sometimes
this will be first-party data that is dynamically generated or frequently
updated.

For example, if your web app is for a newspaper, it might make use of a
first-party API to fetch recent articles, and a third-party API to fetch the
current weather. Both of those types of requests fall into the category of
"dynamic content".

Unlike the App Shell, dynamic content is usually ephemeral, and it's important
to choose the right caching strategy for each source of dynamic content.

## Caching Strategy

You should always use a
[cache-first strategy](https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network)
for your App Shell. `sw-precache` handles the details of that for you.

However, the right caching strategy for your dynamic content is not always
clear-cut. It's recommended that you read through the
[The Offline Cookbook](https://jakearchibald.com/2014/offline-cookbook/) and
think about which strategy provides the right balance between speed and data
freshness for each of your data sources.

Regardless of which strategy you choose, `sw-precache` handles the
implementation for you. All of the standard caching strategies, along with
control over advanced options like maximum cache size and age, are supported via
the automatic inclusion of the `sw-toolbox` library.

# Add `sw-precache` to Your Build

## Automation

`sw-precache` should be automated to run as part of your site's existing build
process. It's important that it's re-run each time any of your App Shell
resources change, so that it can pick up the latest versions.

It is available as a Node module for use in [Gulp](http://gulpjs.com/),
[Grunt](http://gruntjs.com/), or other Node-based build systems. It is also
available as a command-line binary, suitable for inclusion as part of an
[`npm`-based build](https://gist.github.com/addyosmani/9f10c555e32a8d06ddb0).

## Configuration

### Basic

A basic configuration for a web app that relies entirely on local resources, all
located as subdirectories of an `app` directory, might look like:

```js
{
  staticFileGlobs: ['app/**/*.{js,html,css,png,jpg,gif}'],
  stripPrefix: 'app',
  // ...other options as needed...
}
```

### Runtime Caching for Dynamic Content

Once you've chosen an appropriate caching strategy to use for your dynamic
content, you can tell `sw-precache` which
[strategies](https://googlechromelabs.github.io/sw-toolbox/api.html#handlers) to
use for runtime requests that match specific URL patterns:

```js
{
  runtimeCaching: [{
    urlPattern: /^https:\/\/example\.com\/api/,
    handler: 'networkFirst'
  }, {
    urlPattern: /\/articles\//,
    handler: 'fastest',
    options: {
        cache: {
          maxEntries: 10,
          name: 'articles-cache'
        }
    }
  }],
  // ...other options as needed...
}
```

If you use the `runtimeCaching` option, `sw-precache` will automatically include
the [`sw-toolbox` library](https://github.com/GoogleChrome/sw-toolbox) and the
corresponding [routing configuration](https://googlechromelabs.github.io/sw-toolbox/usage.html#basic-routes)
in the service worker file that it generates.

### Server-side Templating

If your web app relies on server-side templating to use several partial files to
construct your App Shell's HTML, it's important to let `sw-precache` know about
those dependencies.

For example, if your web app has two pages, `/home` and `/about`, each of which
depends on both a shared master template and a page-specific template, you can
represent those dependencies as follows:

```js
{
  dynamicUrlToDependencies: {
    '/home': ['templates/master.hbs', 'templates/home.hbs'],
    '/about': ['templates/master.hbs', 'templates/about.hbs']
  },
  // ...other options as needed...
}
```

### Fallback URL

A common pattern when developing
[single page applications](https://en.wikipedia.org/wiki/Single-page_application)
(SPAs) is to bootstrap initial navigations with an App Shell, and then load
dynamic content based on URL routing rules. `sw-precache` supports this with the
concept of a "fallback URL":

```js
{
  navigateFallback: '/app-shell',
  // ...other options as needed...
}
```

In this configuration, whenever the service worker intercepts a
[navigate request](https://fetch.spec.whatwg.org/#concept-request-mode) for a
URL that doesn't exist in the cache, it will respond with the cached contents of
`/app-shell`. It's up to you to ensure that `/app-shell` contains all of the
resources needed to bootstrap your SPA.

# Examples

There are several ready-made examples of varying complexity that use
`sw-preache` as part of their build process:

- https://github.com/GoogleChrome/sw-precache/tree/master/demo
- https://github.com/GoogleChrome/sw-precache/tree/master/app-shell-demo
- https://github.com/GoogleChrome/application-shell

# Other Resources

## Articles
- [Service Workers in Production](https://developers.google.com/web/showcase/case-study/service-workers-iowa)
- [Instant Loading Web Apps with An Application Shell Architecture
](https://developers.google.com/web/updates/2015/11/app-shell)
- [Offline Cookbook](https://jakearchibald.com/2014/offline-cookbook/)

## Videos
- [Instant Loading with Service Workers (Chrome Dev Summit 2015)](https://www.youtube.com/watch?v=jCKZDTtUA2A)
