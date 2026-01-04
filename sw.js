const CACHE_NAME = "tradify-v7";
const APP_STATIC_RESOURCES = ["./index.html"];

self.addEventListener("install", (installEvent) => {
   console.log("Started: Service worker installation");
   installEvent.waitUntil(
      (async () => {
         const cache = await caches.open(CACHE_NAME);
         cache.addAll(APP_STATIC_RESOURCES);
      })()
   );
   console.log("Finished: Service worker installation");
});

self.addEventListener("activate", (activateEvent) => {
   console.log("Started: Service worker activation");
   activateEvent.waitUntil(
      (async () => {
         const names = await caches.keys();
         await Promise.all(
            names.map((name) => {
               if (name !== CACHE_NAME) {
                  console.log("   Old cache '" + name + "' will be updated with new cache '" + CACHE_NAME + "'.");
                  return caches.delete(name);
               }
               return undefined;
            }),
         );
         await clients.claim();
      })(),
   );
   console.log("Finished: Service worker activation");
});

self.addEventListener("fetch", fetchEvent => {
   fetchEvent.respondWith(
      (async () => {
         const cache = await caches.open(CACHE_NAME);
         const cachedResponse = await cache.match(fetchEvent.request);
         if (cachedResponse) {
            console.log("SW: Using cached version of: " + fetchEvent.request.url);
            return cachedResponse;
         }
         console.log("SW: Querying server for: " + fetchEvent.request.url);
         return fetch(fetchEvent.request);
      })() 
   );
});
