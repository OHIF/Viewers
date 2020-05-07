import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

const AppContextProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  const get = ({ configKey = null }) => {
    if (configKey) {
      return config[configKey];
    }

    return config;
  };

  const add = ({ configKey, value }) => {
    setConfig(s => ({
      ...s,
      [configKey]: value,
    }));
  };

  const remove = ({ configKey }) => {
    setConfig(s => ({
      ...s,
      [configKey]: null,
    }));
  };

  return (
    <AppContext.Provider value={{ get, add, remove }}>
      {children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default AppContextProvider;
