const CACHE_NAME = "tradify-v25";
const APP_STATIC_RESOURCES = [
   "./",
   "./index.html"];
/*
   "./index.html",
   "./icons/Title.png",
   "./icons/Idle.svg",
   "./icons/BuyMeACoffee.svg",
   "./assets/aho-corasick/aho-corasick.js",
   "./assets/als-wave-parser/wave-parser.js",
   "./assets/fft/utils.js",
   "./assets/fft/fft.js",
   "./assets/constants.js",
   "./assets/tuneSearchClass.js",
   "./assets/utils.js",
   "./assets/locale.js",
   "./assets/resultService.js",
   "./assets/tuneIndexService.js",
   "./assets/toAbcConverter.js",
   "./assets/processingService.js",
   "./assets/importingService.js",
   "./assets/recordingService.js",
   "./assets/controler.js",
   "./assets/beforePageLoad.js",
   "./assets/afterPageLoad.js",
   "./manifest.json"
];
*/

self.addEventListener("install", (installEvent) => {
   console.log("Started: Service worker installation");
   installEvent.waitUntil(
      (async () => {
         const cache = await caches.open(CACHE_NAME);
         await cache.addAll(APP_STATIC_RESOURCES);
      })()
   );
   console.log("Finished: Service worker installation");
});

/*
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
*/

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
         return await fetch(fetchEvent.request);
         //const networkResponse = await fetch(fetchEvent.request);
         //await cache.put(fetchEvent.request, networkResponse);
         //return networkResponse;
      })() 
   );
});
