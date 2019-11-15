import React, { useState, createContext, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

const DialogContext = createContext(null);

export const useDialog = () => useContext(DialogContext);

const DialogContainer = () => <p></p>;

const DialogProvider = ({ children, service }) => {
  const DEFAULT_OPTIONS = {
    title: '',
    message: '',
  };

  const [count, setCount] = useState(1);
  const [dialogs, setDialogs] = useState([]);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  /**
   * Sets the implementation of a dialog service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ create, destroy });
    }
  }, [service]);

  const create = ({ id }) => {};

  const destroy = ({ id }) => {};

  const dismissAll = () => {
    setCount(1);
    setDialogs(() => []);
    setOptions(DEFAULT_OPTIONS);
  };

  /**
   * Expose dialog methods to window for debug purposes.
   */
  window.dialog = {
    create,
    destroy,
    dismissAll,
    dialogs,
  };

  return (
    <DialogContext.Provider value={{ create, destroy, dismissAll, dialogs }}>
      {!!dialogs && <DialogContainer />}
      {children}
    </DialogContext.Provider>
  );
};

DialogProvider.defaultProps = {
  service: null,
};

DialogProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

/**
 *
 * High Order Component to use the dialog methods through a Class Component
 *
 */
export const withDialog = Component => {
  return function WrappedComponent(props) {
    const dialogContext = {
      ...useDialog(),
    };
    return <Component {...props} dialog={dialogContext} />;
  };
};

export default DialogProvider;
