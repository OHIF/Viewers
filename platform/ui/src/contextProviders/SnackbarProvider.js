import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';

import SnackbarContainer from '../components/snackbar/SnackbarContainer';
import SnackbarTypes from '../components/snackbar/SnackbarTypes';

const SnackbarContext = createContext(null);

export const useSnackbarContext = () => useContext(SnackbarContext);

const SnackbarProvider = ({ children, service }) => {
  const DEFAULT_OPTIONS = {
    title: '',
    message: '',
    duration: 5000,
    autoClose: true,
    position: 'bottomRight',
    type: SnackbarTypes.INFO,
    action: null,
  };

  const [count, setCount] = useState(1);
  const [snackbarItems, setSnackbarItems] = useState([]);

  const show = useCallback(
    options => {
      if (!options || (!options.title && !options.message)) {
        console.warn(
          'Snackbar cannot be rendered without required parameters: title | message'
        );

        return null;
      }

      if (options.type === 'error') {
        console.error(options.error);
      }

      const newItem = {
        ...DEFAULT_OPTIONS,
        ...options,
        id: count,
        visible: true,
      };

      setSnackbarItems(state => [...state, newItem]);
      setCount(count + 1);
    },
    [count, DEFAULT_OPTIONS]
  );

  const hide = useCallback(
    id => {
      const hideItem = items => {
        const newItems = items.map(item => {
          if (item.id === id) {
            item.visible = false;
          }

          return item;
        });

        return newItems;
      };

      setSnackbarItems(state => hideItem(state));

      setTimeout(() => {
        setSnackbarItems(state => [...state.filter(item => item.id !== id)]);
      }, 1000);
    },
    [setSnackbarItems]
  );

  const hideAll = () => {
    // reset count
    setCount(1);

    // remove all items from array
    setSnackbarItems(() => []);
  };

  /**
   * Sets the implementation of a notification service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show });
    }
  }, [service, hide, show]);

  /**
   * expose snackbar methods to window for debug purposes
   * TODO: Check if it's really necessary
   */
  window.snackbar = {
    show,
    hide,
    hideAll,
  };

  return (
    <SnackbarContext.Provider value={{ show, hide, hideAll, snackbarItems }}>
      {!!snackbarItems && <SnackbarContainer />}
      {children}
    </SnackbarContext.Provider>
  );
};

SnackbarProvider.defaultProps = {
  service: null,
};

SnackbarProvider.propTypes = {
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
 * High Order Component to use the snackbar methods through a Class Component
 *
 */
export const withSnackbar = Component => {
  return function WrappedComponent(props) {
    const snackbarContext = {
      ...useSnackbarContext(),
    };
    return <Component {...props} snackbarContext={snackbarContext} />;
  };
};

export default SnackbarProvider;
