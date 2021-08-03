import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { getActiveContexts } from '../store/layout/selectors.js';

let AppContext = React.createContext({});

export const CONTEXTS = {
  CORNERSTONE: 'ACTIVE_VIEWPORT::CORNERSTONE',
  VTK: 'ACTIVE_VIEWPORT::VTK'
};

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children, config }) => {
  const activeContexts = useSelector(state => getActiveContexts(state));

  return (
    <AppContext.Provider value={{ appConfig: config, activeContexts }}>
      {children}
    </AppContext.Provider>
  );
};

export const withAppContext = Component => {
  return function WrappedComponent(props) {
    const { appConfig, activeContexts } = useAppContext();
    return (
      <Component {...props} appConfig={appConfig} activeContexts={activeContexts} />
    );
  };
};

export default AppContext;
