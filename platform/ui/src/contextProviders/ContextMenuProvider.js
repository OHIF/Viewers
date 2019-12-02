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

const ContextMenuProvider = ({ children, service, commandsManager }) => {
  const { create, dismiss } = useDialog();

  /**
   * Sets the implementation of a context menu service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ showContextMenu, showLabellingFlow });
    }
  }, [service, showContextMenu, showLabellingFlow]);

  /**
   * Show the context menu and override its configuration props.
   *
   * @param {ContextMenuProps} props { eventData, isTouchEvent, onClose, visible }
   * @returns void
   */
  const showContextMenu = useCallback(
    ({ event }) => {
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
            showLabellingFlow({
              event: eventData,
              centralize: true,
              props: {
                measurementData,
                skipAddLabelButton: true,
                editLocation: true,
              },
            }),
          onSetDescription: (eventData, measurementData) =>
            showLabellingFlow({
              event: eventData,
              centralize: false,
              defaultPosition: {
                x: (eventData && eventData.currentPoints.client.x) || 0,
                y: (eventData && eventData.currentPoints.client.y) || 0,
              },
              props: {
                measurementData,
                editDescriptionDialog: true,
              },
            }),
        },
        defaultPosition: {
          x: (event && event.currentPoints.client.x) || 0,
          y: (event && event.currentPoints.client.y) || 0,
        },
      });
    },
    [create, dismiss, showLabellingFlow]
  );

  const showLabellingFlow = useCallback(
    ({ centralize, defaultPosition, props }) => {
      dismiss({ id: 'labelling' });
      create({
        id: 'labelling',
        centralize,
        isDraggable: false,
        showOverlay: true,
        content: LabellingManager,
        defaultPosition,
        contentProps: {
          visible: true,
          measurementData: props.measurementData,
          labellingDoneCallback: () => dismiss({ id: 'labelling' }),
          updateLabelling: labellingData =>
            _updateLabellingHandler(labellingData, props.measurementData),
          ...props,
        },
      });
    },
    [_updateLabellingHandler, create, dismiss]
  );

  const _updateLabellingHandler = useCallback(
    (labellingData, measurementData) => {
      const { location, description, response } = labellingData;

      if (location) {
        measurementData.location = location;
      }

      measurementData.description = description || '';

      if (response) {
        measurementData.response = response;
      }

      commandsManager.runCommand(
        'updateTableWithNewMeasurementData',
        measurementData
      );
    },
    [commandsManager]
  );

  return (
    <Provider value={{ showContextMenu, showLabellingFlow }}>
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
    const { showContextMenu, showLabellingFlow } = useContextMenu();
    return (
      <Component {...props} modal={{ showContextMenu, showLabellingFlow }} />
    );
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
  commandsManager: PropTypes.object.isRequired,
};

export default ContextMenuProvider;

export const ContextMenuConsumer = ContextMenuContext.Consumer;
