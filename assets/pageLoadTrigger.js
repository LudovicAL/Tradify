var localeLoaded = false;

document.addEventListener("DOMContentLoaded", async () => {
   console.log("Started: Locale retrieval");
   const initialLocale = supportedOrDefault(browserLocales(true));
   await setLocale(DEFAULT_LOCALE);
   bindLocaleSwitcher(DEFAULT_LOCALE);
   localeLoaded = true;
   console.log("Finished: Locale retrieval");
});

window.onload = async () => {
   await waitForBoolean();
   await loadTuneIndex();
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
