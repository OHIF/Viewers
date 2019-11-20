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
  const [lastDialogPosition, setLastDialogPosition] = useState(null);

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
   * UI Dialog
   *
   * @typedef {Object} DialogProps
   * @property {string} id The dialog id.
   * @property {DialogContent} content The dialog content.
   * @property {Object} contentProps The dialog content props.
   * @property {boolean} isDraggable Controls if dialog content is draggable or not.
   * @property {boolean} showOverlay Controls dialog overlay.
   * @property {ElementPosition} defaultPosition Specifies the `x` and `y` that the dragged item should start at.
   * @property {ElementPosition} position If this property is present, the item becomes 'controlled' and is not responsive to user input.
   * @property {Function} onStart Called when dragging starts. If `false` is returned any handler, the action will cancel.
   * @property {Function} onStop Called when dragging stops.
   * @property {Function} onDrag Called while dragging.
   */

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

    return dialogId;
  }, []);

  /**
   * Dismisses the dialog with a given id.
   *
   * @param {Object} props -
   * @property {string} props.id The dialog id.
   * @returns void
   */
  const dismiss = useCallback(({ id }) => {
    setDialogs(dialogs => dialogs.filter(dialog => dialog.id !== id));
  }, []);

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
  const noDialogs = () => dialogs && dialogs.length < 1;

  /**
   * Moves the dialog to the foreground if clicked.
   *
   * @param {string} id The dialog id.
   * @returns void
   */
  const _reorder = id => {
    setDialogs(dialogs => [
      ...dialogs.filter(dialog => dialog.id !== id),
      dialogs.find(dialog => dialog.id === id),
    ]);
  };

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
    <DialogContext.Provider value={{ create, dismiss, dismissAll, noDialogs }}>
      <div className="DraggableArea">
        {dialogs.map(dialog => {
          const {
            id = null,
            content: DialogContent = null,
            contentProps = null,
            position = null,
            defaultPosition = null,
            isDraggable = true,
            showOverlay = false,
            onStart = null,
            onStop = null,
            onDrag = null,
          } = dialog;

          return (
            <div
              key={id}
              className={classNames('Overlay', showOverlay && 'active')}
            >
              <Draggable
                disabled={!isDraggable}
                position={position}
                defaultPosition={lastDialogPosition || defaultPosition}
                bounds="parent"
                onStart={event => {
                  const e = event || window.event;
                  const target = e.target || e.srcElement;
                  const BLACKLIST = ['SVG', 'BUTTON', 'PATH', 'INPUT'];
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
                  _reorder(id);
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
                    isDragging && 'dragging'
                  )}
                  style={{ zIndex: '999', position: 'absolute' }}
                  onClick={() => _reorder(id)}
                >
                  <DialogContent {...dialog} {...contentProps} />
                </div>
              </Draggable>
            </div>
          );
        })}
      </div>
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
    const { create, dismiss, dismissAll, noDialogs } = useDialog();
    return (
      <Component
        {...props}
        dialog={{ create, dismiss, dismissAll, noDialogs }}
      />
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
