import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import classNames from 'classnames';

import { utils } from '@ohif/core';

import './DialogProvider.styl';

const DialogContext = createContext(null);

export const useDialog = () => useContext(DialogContext);

const DialogProvider = ({ children, service }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dialogs, setDialogs] = useState([]);
  const [lastDialogId, setLastDialogId] = useState(null);
  const [lastDialogPosition, setLastDialogPosition] = useState(null);
  const [centerPositions, setCenterPositions] = useState([]);

  useEffect(() => {
    setCenterPositions(
      dialogs.map(dialog => ({
        id: dialog.id,
        ...getCenterPosition(dialog.id),
      }))
    );
  }, [dialogs]);

  const getCenterPosition = id => {
    const root = document.querySelector('#root');
    const centerX = root.offsetLeft + root.offsetWidth / 2;
    const centerY = root.offsetTop + root.offsetHeight / 2;
    const item = document.querySelector(`#draggableItem-${id}`);
    const itemBounds = item.getBoundingClientRect();
    return {
      x: centerX - itemBounds.width / 2,
      y: centerY - itemBounds.height / 2,
    };
  };

  /**
   * Creates a new dialog and return its id.
   *
   * @param {DialogProps} props The dialog props.
   * @returns The new dialog id.
   */
  const create = useCallback(props => {
    const { id } = props;

    let dialogId = id;
    if (!dialogId) {
      dialogId = utils.guid();
    }

    setDialogs(dialogs => [...dialogs, { ...props, id: dialogId }]);
    setLastDialogId(dialogId);

    return dialogId;
  }, []);

  /**
   * Dismisses the dialog with a given id.
   *
   * @param {Object} props -
   * @property {string} props.id The dialog id.
   * @returns void
   */
  const dismiss = useCallback(
    ({ id }) =>
      setDialogs(dialogs => dialogs.filter(dialog => dialog.id !== id)),
    []
  );

  /**
   * Sets the implementation of a dialog service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ create, dismiss, dismissAll });
    }
  }, [create, dismiss, service]);

  /**
   * Moves the dialog to the foreground if clicked.
   *
   * @param {string} id The dialog id.
   * @returns void
   */
  const _bringToFront = useCallback(id => {
    setDialogs(dialogs => {
      const topDialog = dialogs.find(dialog => dialog.id === id);
      return topDialog
        ? [...dialogs.filter(dialog => dialog.id !== id), topDialog]
        : dialogs;
    });
  }, []);

  /**
   * UI Dialog
   *
   * @typedef {Object} DialogProps
   * @property {string} id The dialog id.
   * @property {DialogContent} content The dialog content.
   * @property {Object} contentProps The dialog content props.
   * @property {boolean} isDraggable Controls if dialog content is draggable or not.
   * @property {boolean} showOverlay Controls dialog overlay.
   * @property {boolean} centralize Center the dialog on the screen.
   * @property {boolean} preservePosition Use last position instead of default.
   * @property {ElementPosition} defaultPosition Specifies the `x` and `y` that the dragged item should start at.
   * @property {Function} onStart Called when dragging starts. If `false` is returned any handler, the action will cancel.
   * @property {Function} onStop Called when dragging stops.
   * @property {Function} onDrag Called while dragging.
   */

  useEffect(() => _bringToFront(lastDialogId), [_bringToFront, lastDialogId]);

  /**
   * Dismisses all dialogs.
   *
   * @returns void
   */
  const dismissAll = () => {
    setDialogs([]);
  };

  /**
   * Indicate if there are no dialogs present.
   *
   * @returns True if no dialogs are present.
   */
  const isEmpty = () => dialogs && dialogs.length < 1;

  const renderDialogs = () =>
    dialogs.map(dialog => {
      const {
        id,
        content: DialogContent,
        contentProps,
        defaultPosition,
        centralize = false,
        preservePosition = true,
        isDraggable = true,
        onStart,
        onStop,
        onDrag,
        showOverlay,
      } = dialog;

      let position =
        (preservePosition && lastDialogPosition) || defaultPosition;
      if (centralize) {
        position = centerPositions.find(position => position.id === id);
      }

      const dragableItem = () => (
        <Draggable
          key={id}
          disabled={!isDraggable}
          position={position}
          defaultPosition={position}
          bounds="parent"
          onStart={event => {
            const e = event || window.event;
            const target = e.target || e.srcElement;
            const BLACKLIST = [
              'SVG',
              'BUTTON',
              'PATH',
              'INPUT',
              'SPAN',
              'LABEL',
            ];
            if (BLACKLIST.includes(target.tagName.toUpperCase())) {
              return false;
            }

            if (validCallback(onStart)) {
              return onStart(event);
            }
          }}
          onStop={event => {
            setIsDragging(false);

            if (validCallback(onStop)) {
              return onStop(event);
            }
          }}
          onDrag={event => {
            setIsDragging(true);
            _bringToFront(id);
            _updateLastDialogPosition(id);

            if (validCallback(onDrag)) {
              return onDrag(event);
            }
          }}
        >
          <div
            id={`draggableItem-${id}`}
            className={classNames(
              'DraggableItem',
              isDragging && 'dragging',
              isDraggable && 'draggable'
            )}
            style={{ zIndex: '999', position: 'absolute' }}
            onClick={() => _bringToFront(id)}
          >
            <DialogContent {...dialog} {...contentProps} />
          </div>
        </Draggable>
      );

      return showOverlay ? (
        <div className="Overlay" key={id}>
          {dragableItem()}
        </div>
      ) : (
        dragableItem()
      );
    });

  /**
   * Update the last dialog position to be used as the new default position.
   *
   * @returns void
   */
  const _updateLastDialogPosition = dialogId => {
    const draggableItemBounds = document
      .querySelector(`#draggableItem-${dialogId}`)
      .getBoundingClientRect();
    setLastDialogPosition({
      x: draggableItemBounds.x,
      y: draggableItemBounds.y,
    });
  };

  const validCallback = callback => callback && typeof callback === 'function';

  return (
    <DialogContext.Provider value={{ create, dismiss, dismissAll, isEmpty }}>
      {!isEmpty() && <div className="DraggableArea">{renderDialogs()}</div>}
      {children}
    </DialogContext.Provider>
  );
};

/**
 *
 * High Order Component to use the dialog methods through a Class Component
 *
 */
export const withDialog = Component => {
  return function WrappedComponent(props) {
    const { create, dismiss, dismissAll, isEmpty } = useDialog();
    return (
      <Component {...props} dialog={{ create, dismiss, dismissAll, isEmpty }} />
    );
  };
};

DialogProvider.defaultProps = {
  service: null,
};

DialogProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
};

export default DialogProvider;
