import i18n from '@ohif/i18n';
import locales from './locales';

function loadLocales() {
  i18n.addLocales(locales);
}

export default loadLocales;
