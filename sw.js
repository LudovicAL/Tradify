self.addEventListener("install", e => {
   console.log("Started: Service worker installation");
   e.waitUntil(
      caches.open("static").then(cache => {
         return cache.addAll(["./"]);
      });
   );
   console.log("Finished: Service worker installation");
});

self.addEventListener("fetch", e => {
   console.log("SW: Intercepting request for: " + e.request.url);
   e.respondWith(cache.match(e.request).then(response => {
      return response || fetch(e.request);
   }));
});
