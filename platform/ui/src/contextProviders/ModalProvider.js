import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const ModalContext = createContext(null);
const { Provider } = ModalContext;

export const useModal = () => useContext(ModalContext);

/**
 * UI Modal
 *
 * @typedef {Object} ModalProps
 * @property {ReactElement|HTMLElement} [content=null] Modal content.
 * @property {Object} [contentProps=null] Modal content props.
 * @property {boolean} [shouldCloseOnEsc=false] Modal is dismissible via the esc key.
 * @property {boolean} [isOpen=true] Make the Modal visible or hidden.
 * @property {boolean} [closeButton=true] Should the modal body render the close button.
 * @property {string} [title=null] Should the modal render the title independently of the body content.
 * @property {string} [customClassName=null] The custom class to style the modal.
 */

const ModalProvider = ({ children, modal: Modal, service }) => {
  const DEFAULT_OPTIONS = {
    content: null,
    contentProps: null,
    shouldCloseOnEsc: false,
    isOpen: true,
    onClose: null,
    closeButton: true,
    showScrollbar: false,
    title: null,
    customClassName: '',
    fullscreen: false,
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  /**
   * Show the modal and override its configuration props.
   *
   * @param {ModalProps} props { content, contentProps, shouldCloseOnEsc, isOpen, closeButton, title, customClassName }
   * @returns void
   */
  const show = useCallback(props => setOptions({ ...options, ...props }), [
    options,
  ]);

  /**
   * Hide the modal and set its properties to default.
   *
   * @returns void
   */
  const hide = useCallback(() => setOptions(DEFAULT_OPTIONS), [
    DEFAULT_OPTIONS,
  ]);

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
    onClose,
    title,
    customClassName,
    shouldCloseOnEsc,
    fullscreen,
    closeButton,
    showScrollbar,
    noScroll,
  } = options;

  return (
    <Provider value={{ show, hide }}>
      {ModalContent && (
        <Modal
          className={classNames(
            customClassName,
            ModalContent.className,
            { visibleScrollbar: showScrollbar },
            { noScroll }
          )}
          shouldCloseOnEsc={shouldCloseOnEsc}
          isOpen={isOpen}
          title={title}
          fullscreen={fullscreen}
          closeButton={closeButton}
          onClose={() => {
            if (onClose) {
              onClose();
            }

            hide();
          }}
        >
          <ModalContent {...contentProps} show={show} hide={hide} />
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
    return <Component {...props} modal={{ show, hide }} />;
  };
};

ModalProvider.defaultProps = {
  service: null,
};

ModalProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  modal: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

export default ModalProvider;

export const ModalConsumer = ModalContext.Consumer;
