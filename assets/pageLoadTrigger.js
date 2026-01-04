var localeLoaded = false;

if ("serviceWorker" in navigator) {
   console.log("Started: Service worker registration");
   navigator.serviceWorker.register("sw.js").then(registration => {
      console.log("   Service Worker registered");
   }).catch(error => {
      console.log("   Service Worker registration failed:\n   " + error);
   });
   console.log("Finished: Service worker registration");
} else {
   let errorMessage = "Votre nagivateur ne supporte pas la navigation hors ligne pour cette application. Veuillez changer de navigateur.";
   alert(errorMessage);
   console.log(errorMessage);
}

document.addEventListener("DOMContentLoaded", async () => {
   console.log("Started: Locale retrieval");
   const browserLocalesArray = browserLocales(true);
   const initialLocale = supportedOrDefault(browserLocalesArray);
   await setLocale(initialLocale);
   bindLocaleSwitcher(initialLocale);
   localeLoaded = true;
   console.log("Finished: Locale retrieval");
});

window.onload = async () => {
   await waitForBoolean();
   await loadTuneIndex();
};

/**
 * Waits for the boolean 'localeLoaded' to be true before continuing.
 */
function waitForBoolean() {
   return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
         if (localeLoaded === true) {
            clearInterval(checkInterval); // Stop checking once true
            resolve(true); // Resolve the promise
         }
      }, 100); // Check every 100 milliseconds
   });
}
