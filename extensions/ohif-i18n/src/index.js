import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LngDetector from 'i18next-browser-languagedetector';
import customDebug from './debugger';
import pkg from '../package.json';
import { debugMode, detectionOptions } from './config';
import locales from './locales';

let translate;

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
      translate = t;
      customDebug(`t function available.`, 'info');
    });
}

customDebug(`version ${pkg.version} loaded.`, 'info');

initI18n();

export { translate as t, addLocales, initI18n };

export default i18n;
