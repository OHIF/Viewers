import React, { useState, createContext, useContext, useEffect } from 'react';

const DEFAULT_STATE = {
  message: undefined,
  type: 'info', // "error" | "warning" | "info" | "success"
  actions: undefined, // array of { type, text, value }
  onSubmit: () => {
    console.log('btn value?');
  },
  onOutsideClick: () => {
    console.warn('default: onOutsideClick');
  },
  onDismiss: () => {
    console.log('dismiss? -1');
  },
  onKeyPress: () => {
    console.log('key pressed?');
  },
};

const ViewportDialogContext = createContext(null);
const { Provider } = ViewportDialogContext;

export const useViewportDialog = () => useContext(ViewportDialogContext);

const ViewportDialogProvider = ({ children, service }) => {
  const [viewportDialogState, setViewportDialogState] = useState(DEFAULT_STATE);
  const show = params => setViewportDialogState({ ...viewportDialogState, ...params });
  const hide = () => setViewportDialogState(DEFAULT_STATE);

  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show });
    }
  }, [hide, service, show]);

  return <Provider value={[viewportDialogState, { show, hide }]}>{children}</Provider>;
};



export default ViewportDialogProvider;
