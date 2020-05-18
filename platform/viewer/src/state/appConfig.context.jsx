import { createContext } from 'react';

export const APP_CONFIG_DEFAULT_VALUE = {
  appConfig: {},
  setCurrentAppConfig: () => {},
};

export const appConfigContext = createContext(APP_CONFIG_DEFAULT_VALUE);
