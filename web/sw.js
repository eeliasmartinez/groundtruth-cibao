// Service worker: keeps a copy of the app on the device so it opens without
// internet. It asks the network first (so a new version shows up at once) and
// answers from the saved copy only when there is no connection or the network
// takes more than a few seconds, as on a weak Wi-Fi.
// Code written with the assistance of Claude Code (Anthropic) and OpenAI Codex.
var CACHE = "plan-b-v42";
// world_rivers.js (2 MB) is not saved up front: it is cached the first time the world mode uses it.
var FILES = ["./", "index.html", "style.css", "app.js", "copy.js", "crops_local.js", "world_data.js", "world.js", "earth.jpg", "peaks.js", "storage.js", "engine.js", "data.js", "geo.js", "provinces.js", "relief.js", "sat.jpg",
  "manifest.webmanifest", "icon.svg", "dam.svg", "icon-192.png", "icon-512.png",
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

var WAIT_MS = 4000;
self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;
  event.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(request, { ignoreSearch: true }).then(function (saved) {
      // The page, its code and texts are small and change with each version: always ask
      // for them in full. Big data files and pictures use the browser's normal cache.
      var code = /(\/|\.html|app\.js|world\.js|copy\.js|storage\.js|engine\.js|crops_local\.js|style\.css)$/.test(new URL(request.url).pathname);
      // A page navigation cannot take extra options, so it is asked again by its address.
      var ask = !code ? request : request.mode === "navigate" ? new Request(request.url, { cache: "no-store", credentials: "same-origin" })
        : new Request(request, { cache: "no-store" });
      var fresh = fetch(ask).then(function (response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      });
      if (!saved) return fresh;
      var timer = new Promise(function (resolve) { setTimeout(function () { resolve(saved); }, WAIT_MS); });
      return Promise.race([fresh.catch(function () { return saved; }), timer]);
    });
  }));
});
