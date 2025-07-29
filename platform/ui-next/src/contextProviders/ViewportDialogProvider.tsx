import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';

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

interface ViewportDialogProviderProps {
  /** Children that will be wrapped with Modal Context */
  children: React.ReactNode[] | React.ReactNode;
  service?: {
    setServiceImplementation?(...args: unknown[]): unknown;
  };
}

const ViewportDialogProvider = ({
  children,
  service
}: ViewportDialogProviderProps) => {
  const [viewportDialogState, setViewportDialogState] = useState(DEFAULT_STATE);
  const show = useCallback(
    params => setViewportDialogState({ ...viewportDialogState, ...params }),
    [viewportDialogState]
  );
  const hide = useCallback(() => setViewportDialogState(DEFAULT_STATE), []);

  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show });
    }
  }, [hide, service, show]);

  return <Provider value={[viewportDialogState, { show, hide }]}>{children}</Provider>;
};

export default ViewportDialogProvider;
