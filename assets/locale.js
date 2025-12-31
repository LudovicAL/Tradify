//This code was adapted from Mohammad Ashour's work:
//https://phrase.com/blog/posts/step-step-guide-javascript-localization/

// The locale our app first shows
const defaultLocale = "fr";
const supportedLocales = ["fr", "en"];
// The active locale
let locale;
// Gets filled with active locale translations
let translations = {};
// When the page content is ready...
document.addEventListener("DOMContentLoaded", () => {
   const initialLocale = supportedOrDefault(browserLocales(true));
   setLocale(defaultLocale);
   bindLocaleSwitcher(defaultLocale);
});

// Load translations for the given locale and translate
// the page to this locale
async function setLocale(newLocale) {
   if (newLocale === locale) {
      return;
   }
   const newTranslations = await fetchTranslationsFor(newLocale);
   locale = newLocale;
   translations = newTranslations;
   translatePage();
}

function isSupported(locale) {
   return supportedLocales.indexOf(locale) > -1;
}

// Retrieve the first locale we support from the given
// array, or return our default locale
function supportedOrDefault(locales) {
   return locales.find(isSupported) || defaultLocale;
}

function browserLocales(languageCodeOnly = false) {
   return navigator.languages.map((locale) => {
      languageCodeOnly ? locale.split("-")[0] : locale;
   });
}

// Retrieve translations JSON object for the given
// locale over the network
async function fetchTranslationsFor(newLocale) {
   const response = await fetch("https://raw.githubusercontent.com/LudovicAL/Tradify/refs/heads/main/lang/REPLACE.json".replaceAll("REPLACE", newLocale));
   return await response.json();
}

// Replace the inner text of each element that has a
// data-i18n-key attribute with the translation corresponding
// to its data-i18n-key
function translatePage() {
   document
      .querySelectorAll("[data-i18n-key]")
      .forEach(translateElement);
}
// Replace the inner text of the given HTML element
// with the translation in the active locale,
// corresponding to the element's data-i18n-key
function translateElement(element) {
   const key = element.getAttribute("data-i18n-key");
   const translation = translations[key];
   element.innerText = translation;
}

// Whenever the user selects a new locale, we
// load the locale's translations and update
// the page
function bindLocaleSwitcher(initialValue) {
   const switcher = document.querySelector("[data-i18n-switcher]");
   switcher.value = initialValue;
   switcher.onchange = (e) => {
      // Set the locale to the selected option[value]
      setLocale(e.target.value);
   };
}
