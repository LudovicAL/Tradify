var localeLoaded = false;

document.addEventListener("DOMContentLoaded", async () => {
   console.log("Started: Locale retrieval");
   const initialLocale = supportedOrDefault(browserLocales(true));
   await setLocale(defaultLocale);
   bindLocaleSwitcher(defaultLocale);
   localeLoaded = true;
   console.log("Finished: Locale retrieval");
});

window.onload = async () => {
   await waitForBoolean();
   console.log("Started: Tune index retrieval");
   tuneIndex = fetchJsonFile(TUNE_INDEX_URL, "tuneIndex", 28);
   console.log("Finished: Tune index retrieval");
};

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
