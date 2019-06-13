import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LngDetector from 'i18next-browser-languagedetector';
import customDebug from './debugger';
import pkg from '../package.json';
import { debugMode, detectionOptions } from './config';

let translate;

function getNameSpaceString(key) {
  const nameSpaceMatcher = key.match(/[^/]+$/g);
  let finalNameSpace;

  if (nameSpaceMatcher !== null) {
    finalNameSpace = nameSpaceMatcher[0].replace('.json', '');
  }

  return finalNameSpace;
}

function getKeyForNameSpaces(key) {
  const cleanedKey = key.match(/[/\\].+(?=[/\\])/);
  let finalKey;

  if (cleanedKey !== null) {
    finalKey = cleanedKey[0].replace(/[/\\]/, '');
    finalKey = finalKey.replace(/[/\\]/, '-');
  }

  return finalKey;
}

function getLocales() {
  var isTestEnvironment = process.env.NODE_ENV === 'test';

  // require.context is exclusive from webpack. This conditional is needed to escape while running tests
  if (isTestEnvironment) {
    return {};
  }

  const context = require.context(`./locales`, true, /\.json$/);
  const locales = {};

  context.keys().forEach(key => {
    locales[getKeyForNameSpaces(key)] = {
      ...locales[getKeyForNameSpaces(key)],
      [getNameSpaceString(key)]: context(key),
    };
  });

  return locales;
}

function addLocales(context) {
  context.keys().forEach(key => {
    i18n.addResourceBundle(
      getKeyForNameSpaces(key),
      getNameSpaceString(key),
      context(key),
      true,
      true
    );
  });
  customDebug(`Locales added successfully`, 'info');
}

function initI18n(detection = detectionOptions) {
  i18n
    .use(LngDetector)
    .use(initReactI18next)
    .init({
      resources: getLocales(),
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
