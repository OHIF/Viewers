import React, { useState, createContext, useContext } from 'react';

const appConfigContext = createContext(null);
const { Provider } = appConfigContext;

export const useAppConfig = () => useContext(appConfigContext);

interface AppConfigProviderProps {
  children?: any;
  value?: any;
}

export function AppConfigProvider({
  children,
  value: initAppConfig
}: AppConfigProviderProps) {
  const [appConfig, setAppConfig] = useState(initAppConfig);

  return <Provider value={[appConfig, setAppConfig]}>{children}</Provider>;
}

export default AppConfigProvider;
