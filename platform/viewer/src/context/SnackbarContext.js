import React, { useState, createContext, useContext } from 'react';
import SnackbarContainer from '../components/Snackbar/SnackbarContainer';
import SnackbarTypes from '../components/Snackbar/SnackbarTypes';

const SnackbarContext = createContext(null);

export const useSnackbarContext = () => useContext(SnackbarContext);

const SnackbarProvider = ({ children }) => {
  const defaultOptions = {
    visible: false,
    title: '',
    message: '',
    id: count,
    duration: 4000,
    position: 'bottomRight',
    type: SnackbarTypes.INFO,
  };

  const [count, setCount] = useState(1);
  const [snackbarItems, setSnackbarItems] = useState([]);

  const show = options => {
    const newItem = {
      ...defaultOptions,
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
    setCount(1);
    setSnackbarItems(() => []);
  };

  // expose snackbar methods to window
  console.log(snackbarItems);
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
  console.error(err);
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
