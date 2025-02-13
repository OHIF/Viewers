import React, { useState, createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import ManagedDialog, { ManagedDialogProps } from './ManagedDialog';

interface DialogContextType {
  show: (options: ManagedDialogProps) => string;
  hide: (id: string) => void;
  hideAll: () => void;
  isEmpty: () => boolean;
}

interface DialogService {
  setServiceImplementation: (implementation: DialogContextType) => void;
  getCustomComponent?: () => React.ComponentType<ManagedDialogProps> | null;
}

interface DialogProviderProps {
  children: React.ReactNode;
  dialog?: React.ComponentType<ManagedDialogProps>;
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

const DialogProvider: React.FC<DialogProviderProps> = ({
  children,
  dialog: DialogComponent = ManagedDialog,
  service = null,
}) => {
  const [dialogs, setDialogs] = useState<(ManagedDialogProps & { id: string })[]>([]);

  const show = useCallback((options: ManagedDialogProps) => {
    const id = options.id;
    setDialogs(prev => [...prev, { ...options, id }]);
    return id;
  }, []);

  const hide = useCallback((id: string) => {
    setDialogs(prev => prev.filter(dialog => dialog.id !== id));
  }, []);

  const hideAll = useCallback(() => {
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

  const CustomDialog = service?.getCustomComponent();
  const RenderedDialog = CustomDialog || DialogComponent;

  return (
    <DialogContext.Provider value={contextValue}>
      {dialogs.map(dialog => (
        <RenderedDialog
          key={dialog.id}
          onClose={hide}
          isOpen={true}
          {...dialog}
        />
      ))}
      {children}
    </DialogContext.Provider>
  );
};

export { DialogProvider };
