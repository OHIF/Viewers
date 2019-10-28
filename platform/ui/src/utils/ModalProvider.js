import React, { useState, createContext, useContext } from 'react';
import Modal from 'react-bootstrap-modal';

const ModalContext = createContext(null);
const { Provider, Consumer } = ModalContext;

export const useModalContext = () => useContext(ModalContext);

const ModalProvider = ({ children }) => {
  const DEFAULT_OPTIONS = {
    component: null,
    props: {
      backdrop: false,
      keyboard: false,
      show: true,
      large: true,
    },
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const show = (component, props = {}) =>
    setOptions({
      ...options,
      component,
      props: { ...options.props, ...props },
    });

  const hide = () => setOptions({ ...options, component: null, props: {} });

  return (
    <Provider value={{ ...options, show, hide }}>
      <Consumer>
        {({ component: Component, props, hide }) =>
          Component ? (
            <Modal {...props} onHide={hide}>
              <Component {...props} hide={hide} />
            </Modal>
          ) : null
        }
      </Consumer>
      {children}
    </Provider>
  );
};

/**
 * Higher Order Component to use the modal methods through a Class Component.
 */
export const withModal = Component => {
  return function WrappedComponent(props) {
    return <Component {...props} modalContext={{ ...useModalContext() }} />;
  };
};

export default ModalProvider;

export const ModalConsumer = ModalContext.Consumer;
