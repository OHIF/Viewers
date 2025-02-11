// ModalProvider.tsx
import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

interface ModalOptions extends Omit<ModalProps, 'isOpen' | 'onClose' | 'children'> {
  content?: React.ComponentType<any>;
  contentProps?: Record<string, any>;
}

interface ModalContextValue {
  show: (options: Partial<ModalOptions>) => void;
  hide: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

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
  // default class names (you can adjust or remove as needed)
  containerClassName: 'max-w-lg mx-auto',
  contentClassName: 'bg-white rounded shadow-lg',
};

const ModalProvider = ({ children, modal: ModalComponent, service = null }) => {
  const { t } = useTranslation('Modals');
  const [options, setOptions] = useState<ModalOptions>(DEFAULT_OPTIONS);

  const ModalContent = options.content;

  const show = useCallback((props: Partial<ModalOptions>) => {
    setOptions(prev => ({ ...prev, ...props }));
  }, []);

  const hide = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
  }, []);

  // Expose the modal methods to your modal service if needed
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ show, hide });
    }
  }, [hide, service, show]);

  const { title, containerClassName, contentClassName } = options;

  // Allow for a custom modal component (otherwise use the one provided)
  const CustomModal = service?.getCustomComponent();

  const RenderedModal = CustomModal ? CustomModal : ModalComponent;

  return (
    <ModalContext.Provider value={{ show, hide }}>
      {ModalContent && (
        <RenderedModal
          isOpen={true}
          onClose={hide}
          title={t(title)}
          containerClassName={classNames(containerClassName, (ModalContent as any).className)}
          contentClassName={contentClassName}
        >
          <ModalContent
            {...(options.contentProps || {})}
            show={show}
            hide={hide}
          />
        </RenderedModal>
      )}
      {children}
    </ModalContext.Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node.isRequired,
  modal: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
    getCustomComponent: PropTypes.func,
  }),
};

export default ModalProvider;
export const ModalConsumer = ModalContext.Consumer;
