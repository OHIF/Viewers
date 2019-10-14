import React, { useState, createContext, useContext } from 'react';
import SnackbarContainer from '../components/snackbar/SnackbarContainer';
import SnackbarTypes from '../components/snackbar/SnackbarTypes';

const SnackbarContext = createContext(null);

export const useSnackbarContext = () => useContext(SnackbarContext);

const SnackbarProvider = ({ children }) => {
  const DEFAULT_OPTIONS = {
    title: '',
    message: '',
    duration: 5000,
    autoClose: true,
    position: 'bottomRight',
    type: SnackbarTypes.INFO,
  };

  const [count, setCount] = useState(1);
  const [snackbarItems, setSnackbarItems] = useState([]);

  const show = options => {
    if (!options || (!options.title && !options.message)) {
      console.warn(
        'Snackbar cannot be rendered without required parameters: title | message'
      );

      return null;
    }

    const newItem = {
      ...DEFAULT_OPTIONS,
      ...options,
      id: count,
      visible: true,
    };

    setSnackbarItems(state => [...state, newItem]);
    setCount(count + 1);
  };

  const hide = id => {
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
  };

  const hideAll = () => {
    // reset count
    setCount(1);

    // remove all items from array
    setSnackbarItems(() => []);
  };

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
