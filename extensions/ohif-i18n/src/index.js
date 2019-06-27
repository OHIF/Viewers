import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LngDetector from 'i18next-browser-languagedetector';
import customDebug from './debugger';
import pkg from '../package.json';
import { debugMode, detectionOptions } from './config';
import locales from './locales';

function addLocales(newLocales) {
  customDebug(`Adding locales ${newLocales}`, 'info');

  let resourceBundle = [];

  for (const key in newLocales) {
    if (newLocales.hasOwnProperty(key)) {
      for (const namespace in newLocales[key]) {
        if (newLocales[key].hasOwnProperty(namespace)) {
          const locale = newLocales[key][namespace];
          resourceBundle.push({ key, namespace, locale });
          i18n.addResourceBundle(key, namespace, locale, true, true);
        }
      }
    }
  }

  customDebug(`Locales added successfully`, 'info');
  customDebug(resourceBundle, 'info');
}

function initI18n(detection = detectionOptions) {
  i18n
    .use(LngDetector)
    .use(initReactI18next)
    .init({
      resources: locales,
      debug: debugMode,
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
      detection,
      fallbackNS: ['Common'],
      defaultNS: 'Common',
      react: {
        wait: true,
      },
    })
    .then(function(t) {
      i18n.T = t;
      customDebug(`T function available.`, 'info');
    });
}

customDebug(`version ${pkg.version} loaded.`, 'info');

initI18n();

i18n.initI18n = initI18n;
i18n.addLocales = addLocales;

export default i18n;
