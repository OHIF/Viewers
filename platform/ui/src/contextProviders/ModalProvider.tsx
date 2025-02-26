import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

const ModalContext = createContext(null);
const { Provider } = ModalContext;

export const useModal = () => useContext(ModalContext);

/**
 * UI Modal
 *
 * @typedef {Object} ModalProps
 * @property {ReactElement|HTMLElement} [content=null] Modal content.
 * @property {Object} [contentProps=null] Modal content props.
 * @property {boolean} [shouldCloseOnEsc=true] Modal is dismissible via the esc key.
 * @property {boolean} [isOpen=true] Make the Modal visible or hidden.
 * @property {boolean} [closeButton=true] Should the modal body render the close button.
 * @property {string} [title=null] Should the modal render the title independently of the body content.
 * @property {string} [customClassName=null] The custom class to style the modal.
 */

const ModalProvider = ({ children, modal: Modal, service = null }) => {
  const DEFAULT_OPTIONS = {
    content: null,
    contentProps: null,
    shouldCloseOnEsc: true,
    shouldCloseOnOverlayClick: true,
    isOpen: true,
    closeButton: true,
    title: null,
    customClassName: '',
    movable: false,
    containerDimensions: null,
    contentDimensions: null,
  };
  const { t } = useTranslation('Modals');

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  /**
   * Show the modal and override its configuration props.
   *
   * @param {ModalProps} props { content, contentProps, shouldCloseOnEsc, isOpen, closeButton, title, customClassName }
   * @returns void
   */
  const show = useCallback(props => setOptions({ ...options, ...props }), [options]);

  /**
   * Hide the modal and set its properties to default.
   *
   * @returns void
   */
  const hide = useCallback(() => {
    setOptions(DEFAULT_OPTIONS);
  }, [DEFAULT_OPTIONS]);

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show });
    }
  }, [hide, service, show]);

  const {
    content: ModalContent,
    contentProps,
    isOpen,
    title,
    customClassName,
    shouldCloseOnEsc,
    closeButton,
    shouldCloseOnOverlayClick,
    movable,
    containerDimensions,
    contentDimensions,
  } = options;

  return (
    <Provider value={{ show, hide }}>
      {ModalContent && (
        <Modal
          className={classNames(customClassName, ModalContent.className)}
          shouldCloseOnEsc={shouldCloseOnEsc}
          isOpen={isOpen}
          title={t(title)}
          closeButton={closeButton}
          onClose={hide}
          shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
          movable={movable}
          containerDimensions={containerDimensions}
          contentDimensions={contentDimensions}
        >
          <ModalContent
            {...contentProps}
            show={show}
            hide={hide}
          />
        </Modal>
      )}
      {children}
    </Provider>
  );
};

/**
 * Higher Order Component to use the modal methods through a Class Component.
 *
 * @returns
 */
export const withModal = Component => {
  return function WrappedComponent(props) {
    const { show, hide } = useModal();
    return (
      <Component
        {...props}
        modal={{ show, hide }}
      />
    );
  };
};

ModalProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  modal: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node, PropTypes.func])
    .isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

export default ModalProvider;

export const ModalConsumer = ModalContext.Consumer;
