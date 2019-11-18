import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

const DialogContext = createContext(null);

export const useDialog = () => useContext(DialogContext);

const DialogProvider = ({ children, service }) => {
  const [count, setCount] = useState(1);
  const [dialogs, setDialogs] = useState([]);

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
    ({ id, content, ...props }) => {
      let dialogId = id;
      if (!dialogId) {
        dialogId = Math.random()
          .toString(36)
          .substr(2, 5);
      }

      const newDialog = {
        id: dialogId,
        content,
        ...props,
      };

      setDialogs(dialogs => [...dialogs, newDialog]);
      setCount(count + 1);

      return dialogId;
    },
    [count]
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
    setCount(1);
    setDialogs(() => []);
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

  /**
   * Expose dialog methods to window for debug purposes.
   */
  window.dialog = {
    create,
    dismiss,
    dismissAll,
    dialogs,
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
            onStop={onStop}
            onDrag={event => {
              _reorder(id);
              onDrag(event);
            }}
          >
            <div
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
