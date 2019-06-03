import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const currentLanguage = process.env.APP_LANG || 'en-US';

function getDefaultLanguage() {
  const mainLanguage = currentLanguage.match(/(.*.)(-)/);
  return mainLanguage !== null ? mainLanguage[1] : null;
}

function getCleanKeyForNameSpaces(key) {
  const regexKeyCleaner = new RegExp(
    `^(\\.\\/${currentLanguage}\\/)(.*.)(\\.json)$`
  );
  const cleanedKey = key.match(regexKeyCleaner);
  return cleanedKey !== null ? cleanedKey[2] : null;
}

function getCleanKeyForDefaults(key) {
  const regexKeyCleaner = new RegExp(
    `^(\\.\\/${getDefaultLanguage()}\\/)(.*.)(\\.json)$`
  );
  const cleanedKey = key.match(regexKeyCleaner);
  return cleanedKey !== null ? cleanedKey[2] : null;
}

function getLocales() {
  const currentLangList = {};
  const defaultLangList = {};
  const locales = {};
  const context = require.context(`./locales`, true, /\.json$/);

  context.keys().forEach(key => {
    const isTheSameOfCurrentLang = key.indexOf(currentLanguage) >= 0;
    const isADefaultLang = key.indexOf(`${getDefaultLanguage()}/`) >= 0;

    if (isTheSameOfCurrentLang) {
      currentLangList[getCleanKeyForNameSpaces(key)] = context(key);
    }

    if (isADefaultLang) {
      defaultLangList[getCleanKeyForDefaults(key)] = context(key);
    }
  });

  locales[currentLanguage] = { ...currentLangList };
  locales[getDefaultLanguage()] = { ...defaultLangList };
  return locales;
}

// console.log(getLocales(), currentLanguage, getDefaultLanguage());

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

  react: {
    wait: true,
  },
});

export default i18n;
