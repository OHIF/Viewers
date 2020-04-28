import React, { useState, createContext, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_OPTIONS = {
  content: null,
  contentProps: null,
  customClassName: null,
};

const ViewportDialogContext = createContext(null);
const { Provider } = ViewportDialogContext;

export const useViewportDialog = () => useContext(ViewportDialogContext);

const ViewportDialogProvider = ({ children, dialog: Dialog }) => {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const show = useCallback((props) => setOptions({ ...options, ...props }), [
    options,
  ]);

  const hide = useCallback(() => setOptions(DEFAULT_OPTIONS), []);

  const {
    content: ViewportDialogContent,
    contentProps,
    customClassName,
  } = options;

  return (
    <Provider value={{ show, hide }}>
      {ViewportDialogContent && (
        <Dialog className={customClassName}>
          <ViewportDialogContent {...contentProps} show={show} hide={hide} />
        </Dialog>
      )}
      {children}
    </Provider>
  );
};

ViewportDialogProvider.propTypes = {
  /** Children that will be wrapped with Modal Context */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  /** dialog component */
  dialog: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
};

export default ViewportDialogProvider;
