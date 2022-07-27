import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const appConfigContext = createContext(null);
const { Provider } = appConfigContext;

export const useAppConfig = () => useContext(appConfigContext);

export function AppConfigProvider({ children, value: initAppConfig }) {
  const [appConfig, setAppConfig] = useState(initAppConfig);

  return <Provider value={[appConfig]}>{children}</Provider>;
}

AppConfigProvider.propTypes = {
  children: PropTypes.any,
  value: PropTypes.any,
};

export default AppConfigProvider;
