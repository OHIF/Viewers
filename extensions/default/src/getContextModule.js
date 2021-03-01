import React, { useState } from 'react';

const HelloWorldContext = React.createContext({
  message: 'HelloWorldContextTesting',
  setMessage: () => { },
});

HelloWorldContext.displayName = 'HelloWorldContext';

function HelloWorldContextProvider({ children }) {
  const [message, setMessage] = useState('HelloWorldContextTesting');

  return (
    <HelloWorldContext.Provider
      value={{
        message,
        setMessage,
      }}
    >
      {children}
    </HelloWorldContext.Provider>
  );
}

function getContextModule() {
  return [
    {
      name: 'HelloWorldContext',
      context: HelloWorldContext,
      provider: HelloWorldContextProvider,
    },
  ];
}

export { HelloWorldContext };

export default getContextModule;
