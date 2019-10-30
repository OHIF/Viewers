import React, { useState, createContext, useContext } from 'react';
import Modal from 'react-bootstrap-modal';

const ModalContext = createContext(null);
const { Provider, Consumer } = ModalContext;

export const useModalContext = () => useContext(ModalContext);

const ModalProvider = ({ children }) => {
  const DEFAULT_OPTIONS = {
    component: null,
    backdrop: false,
    keyboard: false,
    show: true,
    large: true,
    closeButton: true,
    title: null,
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const show = (component, props = {}) =>
    setOptions({
      ...options,
      component,
      ...props,
    });

  const hide = () => setOptions(DEFAULT_OPTIONS);

  return (
    <Provider value={{ ...options, show, hide }}>
      <Consumer>
        {props => {
          const {
            component: Component,
            footer: Footer,
            header: Header,
            body: Body,
            backdrop,
            keyboard,
            show,
            large,
            closeButton,
            title,
            hide,
          } = props;
          return Component || Body ? (
            <Modal
              className={`modal fade themed in ${
                Component ? Component.className : Body.className
              }`}
              backdrop={backdrop}
              keyboard={keyboard}
              show={show}
              large={large}
              closeButton={closeButton}
              title={title}
              onHide={hide}
            >
              <Modal.Header closeButton={closeButton}>
                {title && <Modal.Title>{title}</Modal.Title>}
                {Header && <Header show={show} hide={hide} />}
              </Modal.Header>
              <Modal.Body>
                {Body && <Body show={show} hide={hide} />}
                {Component && <Component show={show} hide={hide} />}
              </Modal.Body>
              <Modal.Footer>
                {Footer && <Footer show={show} hide={hide} />}
              </Modal.Footer>
            </Modal>
          ) : null;
        }}
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
