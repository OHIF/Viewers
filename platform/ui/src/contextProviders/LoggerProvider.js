import React, { useState, createContext, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

const LoggerContext = createContext(null);
const { Provider } = LoggerContext;

export const useLogger = () => useContext(LoggerContext);

const LoggerProvider = ({ children, service }) => {
  const [state, setState] = useState({
    errors: [],
    infos: [],
  });

  useEffect(() => {
    const onErrorHandler = ({ error: errorObject, message }) => {
      error({ error: errorObject, message });
    };
    window.addEventListener('error', onErrorHandler);
    return () => {
      window.removeEventListener('error', onErrorHandler);
    };
  }, []);

  /**
   * Logs an error
   *
   * @param {object} props { error, stack, message, displayOnConsole }
   * @returns void
   */
  const error = ({
    error = {},
    stack = '',
    message = '',
    displayOnConsole = true,
  }) => {
    const errorObject = { error, stack, message, displayOnConsole };
    setState(state => ({ ...state, errors: [...state.errors, errorObject] }));

    if (displayOnConsole) {
      console.error(error);
    }
  };

  /**
   * Logs an info
   *
   * @param {object} props { message, displayOnConsole }
   * @returns void
   */
  const info = ({ message = '', displayOnConsole = true }) => {
    setState(state => ({
      ...state,
      infos: state.infos.push({ message, displayOnConsole }),
    }));

    if (displayOnConsole) {
      console.info(message);
    }
  };

  /**
   * Sets the implementation of a log service that can be used by extensions
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ error, info });
    }
  }, [error, service, info]);

  return <Provider value={{ info, error, state }}>{children}</Provider>;
};

/**
 * Higher Order Component to use the log methods through a Class Component
 *
 * @returns
 */
export const withLogger = Component => {
  return function WrappedComponent(props) {
    const { error, info, state } = useLogger();
    return <Component {...props} logger={{ error, info, state }} />;
  };
};

LoggerProvider.defaultProps = {
  service: null,
};

LoggerProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

export default LoggerProvider;

export const LogConsumer = LoggerContext.Consumer;
