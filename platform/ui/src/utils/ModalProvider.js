import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const ModalContext = createContext(null);
const { Provider, Consumer } = ModalContext;

export const useModal = () => useContext(ModalContext);

const ModalProvider = ({ children, modal: Modal, service }) => {
  const DEFAULT_OPTIONS = {
    component: null /* The component instance inside the modal. */,
    backdrop: false /* Should the modal render a backdrop overlay. */,
    keyboard: false /* Modal is dismissible via the esc key. */,
    show: true /* Make the Modal visible or hidden. */,
    closeButton: true /* Should the modal body render the close button. */,
    title: null /* Should the modal render the title independently of the body content. */,
    customClassName: null /* The custom class to style the modal. */,
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    service.setServiceImplementation({ hide, show });
  }, [hide, service, show]);

  /**
   * Show the modal and override its configuration props.
   *
   * @returns void
   */
  const show = useCallback((component, props = {}) => {
    setOptions(Object.assign({}, options, props, { component }));
    console.log(component, props);
  });

  /**
   * Hide the modal and set its properties to default.
   *
   * @returns void
   */
  const hide = useCallback(() => setOptions(DEFAULT_OPTIONS));

  return (
    <Provider value={{ ...options, show, hide }}>
      <Consumer>
        {props => {
          const { component, footer, header, customClassName } = props;
          return component ? (
            <Modal
              className={classNames(customClassName, component.className)}
              backdrop={options.backdrop}
              keyboard={options.keyboard}
              show={options.show}
              title={options.title}
              closeButton={options.closeButton}
              onHide={hide}
              footer={footer}
              header={header}
            >
              {component}
            </Modal>
          ) : null;
        }}
      </Consumer>
      {children}
    </Provider>
  );
};

ModalProvider.propTypes = {
  children: PropTypes.node,
  modal: PropTypes.node,
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
    return <Component {...props} modalContext={{ ...useModal() }} />;
  };
};

export default ModalProvider;

export const ModalConsumer = ModalContext.Consumer;
