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
  const [dialogBeingDragged, setDialogBeingDragged] = useState(null);
  const [dialogBounds, setDialogBounds] = useState({
    height: 0,
    width: 0,
  });
  const [appBounds, setAppBounds] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  });

  /**
   * Sets movement boundaries.
   *
   * @returns void
   */
  useEffect(() => {
    setAppBounds(document.querySelector('#root').getBoundingClientRect());
  }, []);

  /**
   * Sets dialog boundaries.
   *
   * @returns void
   */
  useEffect(() => {
    if (dialogBeingDragged) {
      setDialogBounds(dialogBeingDragged.getBoundingClientRect());
    }
  }, [dialogBeingDragged]);

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
   * Creates a dialog and return its id.
   *
   * @returns id
   */
  const create = useCallback(
    ({
      id,
      content,
      onSubmit,
      onClose,
      onDrag,
      onStop,
      isDraggable,
      defaultPosition,
      position,
    }) => {
      let dialogId = id;
      if (!dialogId) {
        dialogId = utils.guid();
      }

      const newDialog = {
        id: dialogId,
        content,
        onSubmit,
        onClose,
        onDrag,
        onStop,
        isDraggable,
        defaultPosition,
        position,
      };

      setDialogs(dialogs => [...dialogs, newDialog]);

      return dialogId;
    },
    []
  );

  /**
   * Dismisses the dialog with a given id.
   *
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
   * Moves the dialog to the foreground if clicked.
   *
   * @returns void
   */
  const _reorder = id => {
    setDialogs(dialogs => [
      ...dialogs.filter(dialog => dialog.id !== id),
      dialogs.find(dialog => dialog.id === id),
    ]);
  };

  return (
    <DialogContext.Provider value={{ create, dismiss, dismissAll, dialogs }}>
      {dialogs.map(dialog => {
        const {
          id,
          content: Dialog,
          position /* Position of the dialog. {{x: 0, y: 0}} */,
          defaultPosition,
          isDraggable = true,
          onStop = () => {},
          onDrag = () => {},
        } = dialog;
        return (
          <Draggable
            key={id}
            disabled={!isDraggable}
            position={position}
            defaultPosition={defaultPosition}
            bounds={{
              top: appBounds.top,
              bottom: appBounds.bottom - dialogBounds.height,
              left: appBounds.left,
              right: appBounds.right - dialogBounds.width,
            }}
            onStop={event => {
              onStop(event);
              setDialogBeingDragged(event.target);
              setIsDragging(false);
              return;
            }}
            onDrag={event => {
              const e = event || window.event,
                target = e.target || e.srcElement;
              const BLACKLIST = ['SVG', 'BUTTON', 'PATH', 'INPUT'];
              if (BLACKLIST.includes(target.tagName.toUpperCase())) {
                return false;
              }
              _reorder(id);
              setIsDragging(true);
              onDrag(e);
            }}
          >
            <div
              className={classNames('DraggableItem', isDragging && 'dragging')}
              style={{ zIndex: '999', position: 'absolute' }}
              onClick={() => _reorder(id)}
            >
              <Dialog {...dialog} />
            </div>
          </Draggable>
        );
      })}
      {children}
    </DialogContext.Provider>
  );
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

/**
 *
 * High Order Component to use the dialog methods through a Class Component
 *
 */
export const withDialog = Component => {
  return function WrappedComponent(props) {
    const { create, dismiss, dismissAll } = useDialog();
    return <Component {...props} dialog={{ create, dismiss, dismissAll }} />;
  };
};

export default DialogProvider;
