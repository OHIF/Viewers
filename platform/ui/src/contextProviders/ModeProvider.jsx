import React, { createContext, useContext } from 'react';

const ModeContext = createContext(null);
const { Provider } = ModeContext;
const useMode = () => useContext(ModeContext);

const ModeProvider = ({ mode, children }) => {
  return (
    <Provider value={{ mode }}>
      {children}
    </Provider>
  );
};

export { ModeProvider, useMode };
export default ModeProvider;
