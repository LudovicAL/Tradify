const SERVICE_WORKER_VERSION = "1";
const CACHE_NAME = "tradify-cache-${SERVICE_WORKER_VERSION}";
const APP_STATIC_RESOURCES = ["./"];

self.addEventListener("install", event => {
   console.log("Started: Service worker installation");
   event.waitUntil(
      (async () => {
         const cache = await caches.open(CACHE_NAME);
         cache.addAll(APP_STATIC_RESOURCES);
      })()
   );
   console.log("Finished: Service worker installation");
});

/*
self.addEventListener("fetch", event => {
   event.respondWith(caches.match(event.request).then(response => {
      if (response) {
         console.log("SW: Using cached version of: " + event.request.url);
         return response;
      } else {
         console.log("SW: Querying server for: " + event.request.url);
         return fetch(event.request);
      }
   }));
});
*/

self.addEventListener("activate", (event) => {
   event.waitUntil(
      (async () => {
         const names = await caches.keys();
         await Promise.all(
            names.map((name) => {
               if (name !== CACHE_NAME) {
                  return caches.delete(name);
               }
               return undefined;
            }),
         );
         await clients.claim();
      })(),
   );
});
