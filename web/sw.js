// Service worker: keeps a copy of the app on the device so it opens without
// internet. It answers from the saved copy at once and refreshes that copy in
// the background, so a new version shows up the next time the app is opened.
// Code written with the assistance of Claude Code (Anthropic).
var CACHE = "plan-b-v3";
var FILES = ["./", "index.html", "style.css", "app.js", "engine.js", "data.js", "geo.js",
  "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png",
  "fonts/big-shoulders.woff2", "fonts/archivo.woff2"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(request, { ignoreSearch: true }).then(function (saved) {
      var fresh = fetch(request).then(function (response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(function () { return saved; });
      return saved || fresh;
    });
  }));
});
