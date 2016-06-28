# `sw-precache` App Shell Demo

Deployed version: https://ifixit-pwa.appspot.com/

This demo that makes use of the [iFixit API](https://www.ifixit.com/api/2.0/doc/) to retrieve
and view hardware repair guides.

It uses the App Shell + service worker model to achieve consistent, fast load times.
`sw-precache` handles the generation and caching of the App Shell.

It's written as "universal" JavaScript, with the following stack:
- [React.js](https://facebook.github.io/react/)
- [react-router](https://github.com/rackt/react-router)
- [react-redux](https://github.com/rackt/react-redux)

While it should serve as a good example of the App Shell + service worker model, no claims are made
as to the quality or fluency of the React.js code...

The following video is a companion to the code, and walks through some of the key concepts:

<iframe width="560" height="315" src="https://www.youtube.com/embed/jCKZDTtUA2A" frameborder="0" allowfullscreen></iframe>
