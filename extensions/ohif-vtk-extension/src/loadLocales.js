import { addLocales } from '@ohif/i18n';
import locales from './locales';

function loadLocales() {
  addLocales(locales);
}

export default loadLocales;
