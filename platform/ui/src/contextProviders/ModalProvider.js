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

const ModalProvider = ({ children, modal: Modal, service }) => {
  const DEFAULT_OPTIONS = {
    component: null /* The component instance inside the modal. */,
    shouldCloseOnEsc: false /* Modal is dismissible via the esc key. */,
    isOpen: true /* Make the Modal visible or hidden. */,
    closeButton: true /* Should the modal body render the close button. */,
    title: null /* Should the modal render the title independently of the body content. */,
    customClassName: '' /* The custom class to style the modal. */,
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

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

  /**
   * Show the modal and override its configuration props.
   *
   * @returns void
   */
  const show = useCallback(
    (component, props = {}) =>
      setOptions(Object.assign({}, options, props, { component })),
    [options]
  );

  /**
   * Hide the modal and set its properties to default.
   *
   * @returns void
   */
  const hide = useCallback(() => setOptions(DEFAULT_OPTIONS), [
    DEFAULT_OPTIONS,
  ]);

  const { component: Component } = options;

  return (
    <Provider value={{ show, hide }}>
      {options.component && (
        <Modal
          className={classNames(
            options.customClassName,
            options.component.className
          )}
          shouldCloseOnEsc={options.keyboard}
          isOpen={options.isOpen}
          title={options.title}
          closeButton={options.closeButton}
          onClose={hide}
        >
          <Component {...options} show={show} hide={hide} />
        </Modal>
      )}
      {children}
    </Provider>
  );
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

export default ModalProvider;

export const ModalConsumer = ModalContext.Consumer;
