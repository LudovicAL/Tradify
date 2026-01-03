/**
 * This code was adapted from Mohammad Ashour's work:
 * https://phrase.com/blog/posts/step-step-guide-javascript-localization/
 */

var locale;
var translations = {};

/**
 * Loads translations for the given locale and translate the page to this locale.
 *
 * @param {String} newLocale The locale desired by the user.
 */
async function setLocale(newLocale) {
   if (newLocale === locale) {
      return;
   }
   const newTranslations = await fetchTranslationsFor(newLocale);
   locale = newLocale;
   translations = newTranslations;
   translatePage();
}

/**
 * Retrieves the translation for a given key, in the correct locale.
 * If no translation can be found, the default value is returned.
 *
 * @param {String} key The key for which a translation is requested.
 * @param {String} defaultValue The value to return if no translation is found for the key.
 * @return The translation (or default value) for the given key.
 */
function getTranslation(key, defaultValue) {
   let translationValue = translations?.[key];
   if (typeof translationValue === 'undefined') {
      console.log("   Translation could not be found for: " + key);
      return defaultValue;
   } else {
      return translationValue;
   }
}

/**
 * Checks if a given locale is supported.
 *
 * @param {String} locale The locale for which a check is requested.
 * @return True if the locale is supported, false otherwise.
 */
function isSupported(locale) {
   return SUPPORTED_LOCALES.indexOf(locale) > -1;
}

/**
 * Retrieves the first supported locale from the given array, or the default locale.
 *
 * @param {String} locales An array of locale.
 * @return The first supported local from the given array, or the default value.
 */
function supportedOrDefault(locales) {
   return locales.find(isSupported) || DEFAULT_LOCALE;
}

/**
 * Returns a list of the prefered locales of the client, as documented in his browser's preferences.
 *
 * @param {Boolean} languageCodeOnly
 * @return A list of the prefered locales of the client.
 */
function browserLocales(languageCodeOnly = false) {
   let browserLocaleArray = [];
   for (const locale of navigator.languages) {
      if (languageCodeOnly) {
         browserLocaleArray.push(locale.split("-")[0]);
      } else {
         browserLocaleArray.push(locale);
      }
   }
   return browserLocaleArray;
}

/**
 * Retrieves the translations JSON object for the given locale over the network.
 *
 * @param {String} newLocal The new locale for which the translation JSON object is to be retrieved.
 * @return The retrieved translation JSON object.
 */
async function fetchTranslationsFor(newLocale) {
   return await fetchJsonFile("https://raw.githubusercontent.com/LudovicAL/Tradify/refs/heads/main/lang/REPLACE.json".replaceAll("REPLACE", newLocale), newLocale, 1);
}

/**
 * Replaces the inner text of each element that has a data-i18n-key attribute with the translation corresponding to its key.
 */
function translatePage() {
   document
      .querySelectorAll("[data-i18n-key]")
      .forEach(translateElement);
}

/**
 * Replaces the inner text of the given HTML element with the translation in the active locale, corresponding to the element's key.
 *
 * @param {Object} element The HTML element for which the inner text must be replaced with a translation.
 */
function translateElement(element) {
   const key = element.getAttribute("data-i18n-key");
   const translationValue = translations?.[key];
   if (typeof translationValue === 'undefined') {
      console.log("   Translation could not be found for: " + key);
      return;
   } else {
      element.innerText = translationValue;
   }
}

/**
 * Loads the locale's translations and update the page.
 *
 * @param {String} initialValue The default locale.
 */
function bindLocaleSwitcher(initialValue) {
   const switcher = document.querySelector("[data-i18n-switcher]");
   switcher.value = initialValue;
   switcher.onchange = (e) => {
      // Set the locale to the selected option[value]
      setLocale(e.target.value);
   };
}
