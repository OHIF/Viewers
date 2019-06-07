import i18n from 'i18next';
import {
  initReactI18next,
  withTranslation,
  I18nextProvider,
} from 'react-i18next';

const currentLanguage = process.env.APP_LANG || 'en-US';
const debugMode = process.env.I18N_DEBUG || false;

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

function addLocales(context) {
  context.keys().forEach(key => {
    i18n.addResourceBundle(
      getCleanKeyForNameSpaces(key),
      getNameSpaceString(key),
      context(key),
      true,
      true
    );
  });
}

let translate;

i18n
  .use(initReactI18next)
  .init({
    resources: getLocales(),
    fallbackLng: getDefaultLanguage(),

    lng: currentLanguage,
    debug: debugMode,

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
  })
  .then(function(t) {
    translate = t;
  });

export { translate as t, withTranslation, I18nextProvider, addLocales };
export default i18n;
