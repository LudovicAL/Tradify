const SERVICE_WORKER_VERSION = "1";

self.addEventListener("install", e => {
   console.log("Started: Service worker installation");
   e.waitUntil(caches.open("static").then(cache => {
      return cache.addAll(["./"]);
   }));
   console.log("Finished: Service worker installation");
});

self.addEventListener("fetch", e => {
   e.respondWith(caches.match(e.request).then(response => {
      if (response) {
         console.log("SW: Using cached version of: " + e.request.url);
         return response;         
      } else {
         console.log("SW: Querying server for: " + e.request.url);
         return fetch(e.request);
      }
   }));
});
