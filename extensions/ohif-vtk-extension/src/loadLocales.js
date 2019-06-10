import { addLocales } from '@ohif/i18n';

function loadLocales() {
  const context = require.context(`./locales`, true, /\.json$/);
  addLocales(context);
}

export default loadLocales;
