const CACHE_NAME = "tradify-v31";
const APP_STATIC_RESOURCES = [
   "./",
   "./index.html",
   "./icons/Title.png",
   "./icons/Idle.svg",
   "./icons/BuyMeACoffee.svg",
   "./icons/favicon.ico",
   "./assets/jquery/jquery.min.js",
   "./assets/bootstrap/bootstrap.min.css",
   "./assets/bootstrap/bootstrap.bundle.min.js",
   "./assets/idb-keyval/idb-keyval.mjs",
   "./assets/aho-corasick/aho-corasick.js",
   "./assets/als-wave-parser/wav-parser.js",
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

/*
 * When the page is first loaded, every static resource is loaded in the cache.
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
 * When the page is loaded, if an old cache is detected it is deleted.
 */
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

/*
 * When a fetch request is about to be sent to recuperate a resource, that request is intercepted.
 * If the desired resource exists in the cache, it is fetched there instead of from the server.
 * Otherwise the resource is fetched from the server.
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
      })() 
   );
});
