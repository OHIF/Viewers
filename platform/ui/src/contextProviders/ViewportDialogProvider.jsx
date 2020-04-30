import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';

const DEFAULT_OPTIONS = {
  content: null,
  contentProps: null,
  customClassName: null,
};

const ViewportDialogContext = createContext(null);
const { Provider } = ViewportDialogContext;

export const useViewportDialog = () => useContext(ViewportDialogContext);

const ViewportDialogProvider = ({
  children,
  dialog: Dialog,
  service,
  viewportIndex,
}) => {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);

  const show = useCallback((props) => setOptions({ ...options, ...props }), [
    options,
  ]);

  const hide = useCallback(() => setOptions(DEFAULT_OPTIONS), []);

  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show, viewportIndex });
    }
  }, [hide, service, show, viewportIndex]);

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
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
  viewportIndex: PropTypes.number.isRequired,
};

export default ViewportDialogProvider;
