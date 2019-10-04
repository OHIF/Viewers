import React, { useState, createContext, useContext } from 'react';

const SnackbarContext = createContext(null);

export const useSnackbarContext = () => useContext(SnackbarContext);

const Types = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
};

const colors = {
  [Types.INFO]: '#369cc7',
  [Types.WARNING]: '#ebad1a',
  [Types.SUCCESS]: '#5ea400',
  [Types.ERROR]: '#ec3d3d',
};

const defaultWidth = 320;
const defaultColors = {
  success: {
    rgb: '94, 164, 0',
    hex: '#5ea400',
  },
  error: {
    rgb: '236, 61, 61',
    hex: '#ec3d3d',
  },
  warning: {
    rgb: '235, 173, 23',
    hex: '#ebad1a',
  },
  info: {
    rgb: '54, 156, 199',
    hex: '#369cc7',
  },
};

const defaultShadowOpacity = '0.9';

const SnackbarProvider = ({ children }) => {
  const initialOptions = {
    open: false,
    title: '',
    message: '',
    type: Types.INFO,
  };

  const [snackbarOptions, setSnackbarOptions] = useState({
    ...initialOptions,
  });

  const show = (options = { type: 'info', title: '', message: '' }) => {
    setSnackbarOptions(() => ({
      ...options,
      open: true,
    }));
  };

  const hide = () => {
    setSnackbarOptions(() => ({
      ...initialOptions,
      open: false,
    }));
  };

  const containerStyles = {
    position: 'absolute',
    bottom: '30px',
    right: '30px',
    display: snackbarOptions.open ? 'block' : 'none',
    zIndex: 1,
    minWidth: defaultWidth,
    padding: '10px',
    color: 'white',
  };

  const styles = {
    success: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[snackbarOptions.type].rgb}, ${defaultShadowOpacity})`,
    },

    error: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[snackbarOptions.type].rgb}, ${defaultShadowOpacity})`,
    },

    warning: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[snackbarOptions.type].rgb}, ${defaultShadowOpacity})`,
    },

    info: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[snackbarOptions.type].rgb}, ${defaultShadowOpacity})`,
    },
  };

  // expose snackbar methods to window
  window.snackbar = {
    setSnackbarOptions,
    show,
    hide,
  };

  const renderSnackbar = () => {
    if (
      !snackbarOptions.title &&
      !snackbarOptions.message &&
      snackbarOptions.open
    ) {
      console.warn(
        'Snackbar cannot be rendered without required parameters: title | message'
      );

      return null;
    }

    return (
      <div style={styles[snackbarOptions.type]}>
        {snackbarOptions.title && <div>{snackbarOptions.title}</div>}
        {snackbarOptions.message && <div>{snackbarOptions.message}</div>}
      </div>
    );
  };

  try {
    return (
      <SnackbarContext.Provider
        value={{ snackbarOptions, setSnackbarOptions, show, hide }}
      >
        {renderSnackbar()}
        {children}
      </SnackbarContext.Provider>
    );
  } catch (err) {
    console.error(err);

    return (
      <SnackbarContext.Provider
        value={{ snackbarOptions, setSnackbarOptions, show }}
      >
        {children}
      </SnackbarContext.Provider>
    );
  }
};

export default SnackbarProvider;
