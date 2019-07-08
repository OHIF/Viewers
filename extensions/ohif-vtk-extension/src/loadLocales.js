import i18n from '@ohif/i18n';
import locales from './locales';

async function loadLocales() {
  // Note: We should wait for the i18n initializing
  // promise to complete before adding any new
  // resources to i18next. If the resources are added
  // to i18next before initialization is complete, the
  // backend values (e.g. those from Locize) will not
  // be loaded properly.
  try {
    await i18n.initializing;
  } catch(error) {
    throw new Error(error);
  }

  i18n.addLocales(locales);
}

export default loadLocales;
