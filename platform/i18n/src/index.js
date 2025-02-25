import i18n from 'i18next';
import Backend from 'i18next-locize-backend';
import LastUsed from 'locize-lastused';
import Editor from 'locize-editor';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import customDebug from './debugger';
import pkg from '../package.json';
import { debugMode, detectionOptions } from './config';
import { getLanguageLabel, getAvailableLanguagesInfo } from './utils.js';

// Note: The index.js files inside src/locales are dynamically generated
// by the pullTranslations.sh script
import locales from './locales';

function addLocales(newLocales) {
  customDebug(`Adding locales ${newLocales}`, 'info');

  let resourceBundle = [];

  Object.keys(newLocales).map(key => {
    Object.keys(newLocales[key]).map(namespace => {
      const locale = newLocales[key][namespace];
      resourceBundle.push({ key, namespace, locale });
      i18n.addResourceBundle(key, namespace, locale, true, true);
    });
  });

  customDebug(`Locales added successfully`, 'info');
  customDebug(resourceBundle, 'info');
}

/*
 * Note: Developers can add the API key to use the
 * in-context editor using environment variables.
 * (DO NOT commit the API key)
 */
const locizeOptions = {
  projectId: process.env.LOCIZE_PROJECTID,
  apiKey: process.env.LOCIZE_API_KEY,
  referenceLng: 'en-US',
  fallbacklng: 'en-US',
};

const envUseLocize = !!process.env.USE_LOCIZE;
const envApiKeyAvailable = !!process.env.LOCIZE_API_KEY;
const DEFAULT_LANGUAGE = 'en-US';

function initI18n(
  detection = detectionOptions,
  useLocize = envUseLocize,
  apiKeyAvailable = envApiKeyAvailable
) {
  let initialized;

  if (useLocize) {
    customDebug(`Using Locize for translation files`, 'info');
    initialized = i18n
      // i18next-locize-backend
      // loads translations from your project, saves new keys to it (saveMissing: true)
      // https://github.com/locize/i18next-locize-backend
      .use(Backend)
      // locize-lastused
      // sets a timestamp of last access on every translation segment on locize
      // -> safely remove the ones not being touched for weeks/months
      // https://github.com/locize/locize-lastused
      .use(LastUsed)
      // locize-editor
      // InContext Editor of locize ?locize=true to show it
      // https://github.com/locize/locize-editor
      .use(Editor)
      // detect user language
      // learn more: https://github.com/i18next/i18next-browser-languageDetector
      .use(LanguageDetector)
      // pass the i18n instance to react-i18next.
      .use(initReactI18next)
      // init i18next
      // for all options read: https://www.i18next.com/overview/configuration-options
      .init({
        fallbackLng: DEFAULT_LANGUAGE,
        saveMissing: apiKeyAvailable,
        debug: debugMode,
        keySeparator: false,
        interpolation: {
          escapeValue: false, // not needed for react as it escapes by default
        },
        detection,
        backend: locizeOptions,
        locizeLastUsed: locizeOptions,
        editor: {
          ...locizeOptions,
          onEditorSaved: async (lng, ns) => {
            // reload that namespace in given language
            await i18n.reloadResources(lng, ns);
            // trigger an event on i18n which triggers a rerender
            // based on bindI18n below in react options
            i18n.emit('editorSaved');
          },
        },
        react: {
          useSuspense: true,
          bindI18n: 'languageChanged editorSaved',
        },
      });
  } else {
    customDebug(`Using local translation files`, 'info');
    initialized = i18n
      // detect user language
      // learn more: https://github.com/i18next/i18next-browser-languageDetector
      .use(LanguageDetector)
      // pass the i18n instance to react-i18next.
      .use(initReactI18next)
      // init i18next
      // for all options read: https://www.i18next.com/overview/configuration-options
      .init({
        fallbackLng: DEFAULT_LANGUAGE,
        resources: locales,
        debug: debugMode,
        keySeparator: false,
        interpolation: {
          escapeValue: false, // not needed for react as it escapes by default
        },
        detection,
        react: {
          useSuspense: true,
        },
      });
  }

  return initialized.then(function (t) {
    i18n.T = t;
    customDebug(`T function available.`, 'info');
  });
}

customDebug(`version ${pkg.version} loaded.`, 'info');

i18n.initializing = initI18n();
i18n.initI18n = initI18n;
i18n.addLocales = addLocales;
i18n.availableLanguages = getAvailableLanguagesInfo(locales);
i18n.defaultLanguage = {
  label: getLanguageLabel(DEFAULT_LANGUAGE),
  value: DEFAULT_LANGUAGE,
};
i18n.currentLanguage = () => ({
  label: getLanguageLabel(i18n.language),
  value: i18n.language,
});

export default i18n;
