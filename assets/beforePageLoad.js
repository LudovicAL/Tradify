if ("serviceWorker" in navigator) {
   window.addEventListener('load' , () => {
      console.log("Started: Service worker registration");
      navigator.serviceWorker.register("./sw.js").then(registration => {
         console.log("   Service Worker registered with scope: " + registration.scope);
      }).catch(error => {
         console.log("   Service Worker registration failed:\n   " + error);
      });
      console.log("Finished: Service worker registration");
   });
} else {
   console.log("   Current browser does not support Service Workers.");
}
