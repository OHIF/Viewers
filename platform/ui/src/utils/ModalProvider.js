import React, { useState, createContext, useContext } from 'react';
import Modal from 'react-modal';

const ModalContext = createContext(null);

export const useModalContext = () => useContext(ModalContext);

/* Bind modal to app root (http://reactcommunity.org/react-modal/accessibility/). */
Modal.setAppElement('#root');

const computedStyle = getComputedStyle(document.body);
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: computedStyle.getPropertyValue('--ui-gray-darker'),
    color: computedStyle.getPropertyValue('--text-secondary-color'),
    borderColor: computedStyle.getPropertyValue('--ui-border-color'),
    border: 0,
    borderRadius: '6px',
  },
  overlay: {
    background: 'rgba(0, 0, 0, 0.5)',
  },
};

const ModalProvider = ({ children }) => {
  const DEFAULT_OPTIONS = {
    component: null,
    props: {
      shouldCloseOnOverlayClick: false,
      shouldCloseOnEsc: false,
    },
  };

  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const show = (component, props = {}) => {
    setOptions({ ...options, component, props: { ...options.props, props } });
  };

  const hide = () => {
    setOptions({ ...options, component: null, props: {} });
  };

  return (
    <ModalContext.Provider value={{ ...options, show, hide }}>
      <ModalContext.Consumer>
        {({ component: Component, props, hide }) =>
          Component ? (
            <Modal
              style={customStyles}
              isOpen={true}
              {...props}
              onRequestClose={hide}
            >
              <Component {...props} onRequestClose={hide} />
            </Modal>
          ) : null
        }
      </ModalContext.Consumer>
      {children}
    </ModalContext.Provider>
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
