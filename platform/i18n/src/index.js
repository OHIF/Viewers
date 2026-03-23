import Backend from 'i18next-locize-backend';
import LastUsed from 'locize-lastused';
import Editor from 'locize-editor';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import customDebug from './debugger';
import pkg from '../package.json';
import { debugMode, detectionOptions } from './config';
import { getLanguageLabel, getAvailableLanguagesInfo } from './utils.js';

// Import dynamically generated locales
import locales from './locales';

import i18n from 'i18next';

// (Plain JS) — custom properties are attached to the i18n instance below.

// Compatibility shim: newer i18next removed `languageUtils.isWhitelisted` but
// `i18next-browser-languagedetector` calls it synchronously inside `detect()`,
// which runs during `i18n.init()` — before any `.then()` callback fires.
// Patching the prototype of LanguageDetector is the only reliable place to
// inject the fix right before `detect()` executes.
(function _patchLanguageDetector() {
  try {
    // Use a plain variable to avoid TS type-assertion errors in .js files.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Detector = /** @type {any} */ (LanguageDetector);
    const proto = Detector && (Detector.prototype || Detector);
    const origDetect = proto && proto.detect;
    if (typeof origDetect !== 'function') return;

    proto.detect = function patchedDetect(...args) {
      if (
        this.services &&
        this.services.languageUtils &&
        typeof this.services.languageUtils.isWhitelisted !== 'function'
      ) {
        // eslint-disable-next-line no-param-reassign
        this.services.languageUtils.isWhitelisted = function (lng, whitelist) {
          if (!whitelist) return true;
          if (Array.isArray(whitelist)) return whitelist.indexOf(lng) > -1;
          if (typeof whitelist === 'object') {
            return Object.prototype.hasOwnProperty.call(whitelist, lng);
          }
          return false;
        };
      }
      return origDetect.apply(this, args);
    };
  } catch (e) {
    // Non-fatal — detection will fall back to the default language.
  }
})();

function addLocales(newLocales) {
  customDebug(`Adding locales ${Object.keys(newLocales)}`, 'info');

  const resourceBundle = [];

  Object.keys(newLocales).forEach(key => {
    Object.keys(newLocales[key]).forEach(namespace => {
      const locale = newLocales[key][namespace];
      resourceBundle.push({ key, namespace, locale });
      i18n.addResourceBundle(key, namespace, locale, true, true);
    });
  });

  customDebug(`Locales added successfully`, 'info');
  customDebug(resourceBundle, 'info');
}

const locizeOptions = {
  projectId: process.env.LOCIZE_PROJECTID,
  apiKey: process.env.LOCIZE_API_KEY,
  referenceLng: 'en-US',
  fallbackLng: 'en-US',
};

const envUseLocize = !!process.env.USE_LOCIZE;
const envApiKeyAvailable = !!process.env.LOCIZE_API_KEY;
const DEFAULT_LANGUAGE = 'en-US';

async function initI18n(
  detection = detectionOptions,
  useLocize = envUseLocize,
  apiKeyAvailable = envApiKeyAvailable
) {
  let initialized;

  if (useLocize) {
    customDebug(`Using Locize for translation files`, 'info');

    initialized = i18n
      .use(Backend)
      .use(LastUsed)
      .use(Editor)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: DEFAULT_LANGUAGE,
        saveMissing: apiKeyAvailable,
        debug: debugMode,
        keySeparator: false,
        interpolation: { escapeValue: false },
        detection,
        backend: locizeOptions,
        locizeLastUsed: locizeOptions,
        editor: {
          ...locizeOptions,
          onEditorSaved: async (lng, ns) => {
            await i18n.reloadResources(lng, ns);
            i18n.emit('editorSaved');
          },
        },
        react: { useSuspense: true, bindI18n: 'languageChanged editorSaved' },
      });
  } else {
    customDebug(`Using local translation files`, 'info');

    initialized = i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: DEFAULT_LANGUAGE,
        resources: locales,
        debug: debugMode,
        keySeparator: false,
        interpolation: { escapeValue: false },
        detection,
        react: { useSuspense: true },
      });
  }

  return initialized.then(t => {
    // @ts-ignore
    i18n.T = t;
    customDebug(`T function available.`, 'info');
  });
}

// Assign custom properties
i18n.initializing = initI18n();
i18n.initI18n = initI18n;
i18n.addLocales = addLocales;
i18n.availableLanguages = getAvailableLanguagesInfo(locales);
i18n.defaultLanguage = {
  label: getLanguageLabel(DEFAULT_LANGUAGE),
  value: DEFAULT_LANGUAGE,
};
i18n.currentLanguage = () => ({
  // @ts-ignore
  label: getLanguageLabel(i18n.language),
  // @ts-ignore
  value: i18n.language,
});

customDebug(`version ${pkg.version} loaded.`, 'info');

export default i18n;
