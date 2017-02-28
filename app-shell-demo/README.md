# `sw-precache` App Shell Demo

Deployed version: https://ifixit-pwa.appspot.com/

This demo that makes use of the [iFixit API](https://www.ifixit.com/api/2.0/doc/) to retrieve
and view hardware repair guides.

It uses the [Application Shell](https://developers.google.com/web/fundamentals/architecture/app-shell) + service worker model to achieve consistent, fast load times.
`sw-precache` handles the generation and caching of the App Shell.

It's written as "universal" JavaScript, with the following stack:
- [React.js](https://facebook.github.io/react/)
- [react-router](https://github.com/rackt/react-router)
- [react-redux](https://github.com/rackt/react-redux)

While it should serve as a good example of the App Shell + service worker model, no claims are made
as to the quality or fluency of the React.js code...

The following video is a companion to the code, and walks through some of the key concepts:

[![Instant Loading with Service Workers video](http://img.youtube.com/vi/jCKZDTtUA2A/0.jpg)](http://www.youtube.com/watch?v=jCKZDTtUA2A "Instant Loading with Service Workers")
