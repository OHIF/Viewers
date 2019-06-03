import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const currentLanguage = process.env.APP_LANG || 'es-MX';

function getDefaultLanguage() {
  const mainLanguage = currentLanguage.match(/(.*.)(-)/);
  return mainLanguage !== null ? mainLanguage[1] : null;
}

function getNameSpaceString(key) {
  const nameSpaceMatcher = key.match(/[^/]+$/g);
  let finalNameSpace;

  if (nameSpaceMatcher !== null) {
    finalNameSpace = nameSpaceMatcher[0].replace('.json', '');
  }

  return finalNameSpace;
}

function getCleanKeyForNameSpaces(key) {
  const cleanedKey = key.match(/[/\\].+(?=[/\\])/);
  let finalKey;

  if (cleanedKey !== null) {
    finalKey = cleanedKey[0].replace(/[/\\]/, '');
    finalKey = finalKey.replace(/[/\\]/, '-');
  }

  return finalKey;
}

function getLocales() {
  const context = require.context(`./locales`, true, /\.json$/);
  const locales = {};

  context.keys().forEach(key => {
    locales[getCleanKeyForNameSpaces(key)] = {
      ...locales[getCleanKeyForNameSpaces(key)],
      [getNameSpaceString(key)]: context(key),
    };
  });

  return locales;
}

i18n.use(initReactI18next).init({
  resources: getLocales(),
  fallbackLng: getDefaultLanguage(),
  lng: currentLanguage,
  debug: true,

  // have a common namespace used around the full app
  keySeparator: false, // uses content as keys
  interpolation: {
    escapeValue: false,
  },

  fallbackNS: ['common'],
  defaultNS: 'common',

  react: {
    wait: true,
  },
});

export default i18n;
