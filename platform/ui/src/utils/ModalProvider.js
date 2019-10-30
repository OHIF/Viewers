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
      closeButton: true,
      title: null,
    },
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const show = (component, props = {}) =>
    setOptions({
      ...options,
      component,
      props: { ...options.props, ...props },
    });

  const hide = () => setOptions(DEFAULT_OPTIONS);

  return (
    <Provider value={{ ...options, show, hide }}>
      <Consumer>
        {({ component: Component, props, hide }) =>
          Component ? (
            <Modal
              className={`modal fade themed in ${Component.className}`}
              {...props}
              onHide={hide}
            >
              <Modal.Header closeButton={props.closeButton}>
                {props.title && <Modal.Title>{props.title}</Modal.Title>}
                {props.header}
              </Modal.Header>
              <Modal.Body>
                <Component {...props} hide={hide} />
              </Modal.Body>
              <Modal.Footer>{props.footer}</Modal.Footer>
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
