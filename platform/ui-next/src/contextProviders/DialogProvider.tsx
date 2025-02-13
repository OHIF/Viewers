import React, { useState, createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/Dialog/Dialog';

interface DialogOptions {
  id?: string;
  title?: string;
  content: React.ComponentType<any>;
  contentProps?: Record<string, unknown>;
  description?: string;
  movable?: boolean;
  showOverlay?: boolean;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
  initialPosition?: { x: number; y: number };
}

interface DialogContextType {
  show: (options: DialogOptions) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  isEmpty: () => boolean;
}

interface DialogService {
  setServiceImplementation: (implementation: DialogContextType) => void;
}

interface DialogProviderProps {
  children: React.ReactNode;
  service?: DialogService | null;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const DialogProvider: React.FC<DialogProviderProps> = ({ children, service = null }) => {
  const [dialogs, setDialogs] = useState<(DialogOptions & { id: string })[]>([]);

  const show = useCallback((options: DialogOptions) => {
    const id = options.id || generateId();
    console.debug('Showing dialog with id:', id);
    setDialogs(prev => [...prev, { ...options, id }]);
    return id;
  }, []);

  const hide = useCallback((id: string) => {
    console.debug('Hiding dialog with id:', id);
    setDialogs(prev => prev.filter(dialog => dialog.id !== id));
  }, []);

  const hideAll = useCallback(() => {
    console.debug('Hiding all dialogs');
    setDialogs([]);
  }, []);

  const isEmpty = useCallback(() => dialogs.length === 0, [dialogs]);

  const contextValue = useMemo(
    () => ({
      show,
      hide,
      hideAll,
      isEmpty,
    }),
    [show, hide, hideAll, isEmpty]
  );

  useEffect(() => {
    if (service) {
      service.setServiceImplementation(contextValue);
    }
  }, [service, contextValue]);

  return (
    <DialogContext.Provider value={contextValue}>
      {dialogs.map(dialog => {
        const DialogContentComponent = dialog.content;
        return (
          <Dialog
            key={dialog.id}
            open={true}
            onOpenChange={() => hide(dialog.id)}
            movable={dialog.movable}
            shouldCloseOnEsc={dialog.shouldCloseOnEsc}
            shouldCloseOnOverlayClick={dialog.shouldCloseOnOverlayClick}
          >
            <DialogContent
              style={
                dialog.initialPosition
                  ? {
                      position: 'fixed',
                      left: `${dialog.initialPosition.x}px`,
                      top: `${dialog.initialPosition.y}px`,
                    }
                  : undefined
              }
            >
              {dialog.title && (
                <DialogHeader>
                  <DialogTitle>{dialog.title}</DialogTitle>
                  {dialog.description && (
                    <DialogDescription>{dialog.description}</DialogDescription>
                  )}
                </DialogHeader>
              )}
              <DialogContentComponent
                {...dialog.contentProps}
                onDismiss={() => hide(dialog.id)}
              />
            </DialogContent>
          </Dialog>
        );
      })}
      {children}
    </DialogContext.Provider>
  );
};

export default DialogProvider;

// HOC for class components
export const withDialog = <P extends object>(
  Component: React.ComponentType<P & { dialog: DialogContextType }>
) => {
  return function WrappedComponent(props: P) {
    const dialog = useDialog();
    return (
      <Component
        {...props}
        dialog={dialog}
      />
    );
  };
};
