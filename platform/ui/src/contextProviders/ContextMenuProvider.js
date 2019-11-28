import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';

import ToolContextMenu from '../../../viewer/src/connectedComponents/ToolContextMenu';
import LabellingManager from '../../../viewer/src/components/Labelling/LabellingManager';

import { useDialog } from './DialogProvider';

const ContextMenuContext = createContext(null);
const { Provider } = ContextMenuContext;

export const useContextMenu = () => useContext(ContextMenuContext);

const ContextMenuProvider = ({ children, service }) => {
  const dialog = useDialog();
  const [contextMenuDialogId, setContextMenuDialogId] = useState();
  const [labellingDialogId, setLabellingDialogId] = useState();

  const DEFAULTS = {
    LABELLING: {},
    CONTEXT_MENU: {},
  };

  const [labellingProps, setLabellingProps] = useState(DEFAULTS.LABELLING);
  const [contextMenuProps, setContextMenuProps] = useState(
    DEFAULTS.CONTEXT_MENU
  );

  /**
   * Sets the implementation of a context menu service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ hide, show });
    }
  }, [hide, service, show]);

  /**
   * Show the context menu and override its configuration props.
   *
   * @param {ContextMenuProps} props { eventData, isTouchEvent, onClose, visible }
   * @returns void
   */
  const show = useCallback(
    props => {
      setDialogId(
        dialog.create({ content: ToolContextMenu, contentProps: props })
      );
      setOptions({ ...options, ...props });
    },
    [dialog]
  );

  /**
   * Hide the context menu and set its properties to default.
   *
   * @returns void
   */
  const hide = useCallback(() => dialog.dismiss(dialogId), [dialog]);

  return (
    <Provider value={{ show, hide }}>
      <ToolContextMenu {...contextMenuDefaultProps} />
      <LabellingManager {...labellingDefaultProps} />
      {children}
    </Provider>
  );
};

/**
 * Higher Order Component to use the context menu methods through a Class Component.
 *
 * @returns
 */
export const withContextMenu = Component => {
  return function WrappedComponent(props) {
    const { show, hide } = useContextMenu();
    return <Component {...props} modal={{ show, hide }} />;
  };
};

ContextMenuProvider.defaultProps = {
  service: null,
};

ContextMenuProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

export default ContextMenuProvider;

export const ContextMenuConsumer = ContextMenuContext.Consumer;
