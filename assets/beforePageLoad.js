if ("serviceWorker" in navigator) {
   window.addEventListener('load' , () => {
      console.log("Started: Service worker registration");
      let result = registerServiceWorker();
      console.log(result);
      console.log("Finished: Service worker registration");
   });
} else {
   let errorMessage = "Votre nagivateur ne supporte pas la navigation hors ligne pour cette application. Veuillez changer de navigateur.";
   alert(errorMessage);
   console.log(errorMessage);
}

async function registerServiceWorker() {
   await navigator.serviceWorker.register("./sw.js").then(registration => {
         return "   Service Worker registered with scope: " + registration.scope;
      }).catch(error => {
         return "   Service Worker registration failed:\n   " + error;
      });
}
