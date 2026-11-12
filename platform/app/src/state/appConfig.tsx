import React, { useState, createContext, useContext } from 'react';

const appConfigContext = createContext(null);
const { Provider } = appConfigContext;

export const useAppConfig = () => useContext(appConfigContext);

export function AppConfigProvider({ children, value: initAppConfig }) {
  const [appConfig, setAppConfig] = useState(initAppConfig);

  return <Provider value={[appConfig, setAppConfig]}>{children}</Provider>;
}



export default AppConfigProvider;
