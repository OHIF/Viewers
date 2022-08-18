import React, { useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { getActiveContexts } from '../store/layout/selectors.js';

let AppContext = React.createContext({});

export const CONTEXTS = {
         CORNERSTONE: 'ACTIVE_VIEWPORT::CORNERSTONE',
         VTK: 'ACTIVE_VIEWPORT::VTK',
       };

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children, config }) => {
  const activeContexts = useSelector(state => getActiveContexts(state));
  const [editedSegmentation, setEditedSegmentation] = useState(false);

  return (
    <AppContext.Provider
      value={{
        appConfig: config,
        activeContexts,
        editedSegmentation,
        setEditedSegmentation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const withAppContext = Component => {
  return function WrappedComponent(props) {
    const {
      appConfig,
      activeContexts,
      editedSegmentation,
      setEditedSegmentation,
    } = useAppContext();
    return (
      <Component
        {...props}
        appConfig={appConfig}
        activeContexts={activeContexts}
        editedSegmentation={editedSegmentation}
        setEditedSegmentation={setEditedSegmentation}
      />
    );
  };
};

export default AppContext;
