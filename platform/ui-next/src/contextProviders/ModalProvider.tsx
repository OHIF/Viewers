import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalContentProps {
  show: (options: Partial<ModalOptions>) => void;
  hide: () => void;
  [key: string]: unknown;
}

interface ModalOptions {
  title?: string;
  shouldCloseOnEsc?: boolean;
  content?: React.ComponentType<ModalContentProps>;
  contentProps?: Record<string, unknown>;
  containerClassName?: string;
  contentClassName?: string;
}

interface ModalContextType {
  show: (options: Partial<ModalOptions>) => void;
  hide: () => void;
}

interface ModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return ctx;
};

const DEFAULT_OPTIONS: ModalOptions = {
  title: '',
  shouldCloseOnEsc: true,
};

interface ModalService {
  setServiceImplementation: (implementation: ModalContextType) => void;
  getCustomComponent: () => React.ComponentType<ModalComponentProps> | null;
}

interface ModalProviderProps {
  children: React.ReactNode;
  modal: React.ComponentType<ModalComponentProps>;
  service?: ModalService | null;
}

const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
  modal: ModalComponent,
  service = null,
}) => {
  const { t } = useTranslation('Modals');
  const [options, setOptions] = useState<ModalOptions>(DEFAULT_OPTIONS);

  const ModalContent = options.content;

  const show = useCallback((props: Partial<ModalOptions>) => {
    setOptions(prev => ({ ...prev, ...props }));
  }, []);

  const hide = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
  }, []);

  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ show, hide });
    }
  }, [hide, service, show]);

  const { title } = options;

  const CustomModal = service?.getCustomComponent();
  const RenderedModal = CustomModal || ModalComponent;

  return (
    <ModalContext.Provider value={{ show, hide }}>
      {ModalContent && (
        <RenderedModal
          isOpen={true}
          onClose={hide}
          title={t(title)}
          containerClassName={ModalContent.ContainerClassName}
          contentClassName={ModalContent.ContentClassName}
          {...options}
        >
          <ModalContent
            {...options.contentProps}
            show={show}
            hide={hide}
          />
        </RenderedModal>
      )}
      {children}
    </ModalContext.Provider>
  );
};

export { ModalProvider };
export const ModalConsumer = ModalContext.Consumer;
