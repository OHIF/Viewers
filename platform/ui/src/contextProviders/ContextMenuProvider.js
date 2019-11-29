import React, {
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
  const { create, dismiss } = useDialog();

  /**
   * Sets the implementation of a context menu service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ show });
    }
  }, [service, show]);

  /**
   * Show the context menu and override its configuration props.
   *
   * @param {ContextMenuProps} props { eventData, isTouchEvent, onClose, visible }
   * @returns void
   */
  const show = useCallback(
    ({ event, updateLabellingCallback }) => {
      dismiss({ id: 'context-menu' });
      create({
        id: 'context-menu',
        isDraggable: false,
        useLastPosition: false,
        content: ToolContextMenu,
        contentProps: {
          eventData: event,
          onClose: () => dismiss({ id: 'context-menu' }),
          onSetLabel: (eventData, measurementData) =>
            _onSetLabel(eventData, measurementData, updateLabellingCallback),
          onSetDescription: (eventData, measurementData) =>
            _onSetDescription(
              eventData,
              measurementData,
              updateLabellingCallback
            ),
        },
        defaultPosition: {
          x: (event && event.currentPoints.client.x) || 0,
          y: (event && event.currentPoints.client.y) || 0,
        },
      });
    },
    [_onSetDescription, _onSetLabel, create, dismiss]
  );

  const _onSetLabel = useCallback(
    (eventData, measurementData, updateLabellingCallback) => {
      create({
        id: 'labelling',
        centralize: true,
        isDraggable: false,
        content: LabellingManager,
        contentProps: {
          visible: true,
          eventData,
          measurementData,
          skipAddLabelButton: true,
          editLocation: true,
          labellingDoneCallback: () => dismiss({ id: 'labelling' }),
          updateLabelling: labellingData =>
            updateLabellingCallback(labellingData, measurementData),
        },
      });
    },
    [create, dismiss]
  );

  const _onSetDescription = useCallback(
    (eventData, measurementData, updateLabellingCallback) => {
      create({
        id: 'labelling',
        centralize: true,
        isDraggable: false,
        content: LabellingManager,
        contentProps: {
          visible: true,
          eventData,
          measurementData,
          editDescriptionDialog: true,
          labellingDoneCallback: () => dismiss({ id: 'labelling' }),
          updateLabelling: labellingData =>
            updateLabellingCallback(labellingData, measurementData),
        },
      });
    },
    [create, dismiss]
  );

  return <Provider value={{ show }}>{children}</Provider>;
};

/**
 * Higher Order Component to use the context menu methods through a Class Component.
 *
 * @returns
 */
export const withContextMenu = Component => {
  return function WrappedComponent(props) {
    const { show } = useContextMenu();
    return <Component {...props} modal={{ show }} />;
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
