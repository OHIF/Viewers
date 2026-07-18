import React, { useState, useImperativeHandle, useCallback, useLayoutEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/Dialog/Dialog';
import { cn } from '../lib/utils';

type Position = {
  x: number;
  y: number;
};

export interface ManagedDialogProps {
  id: string;
  isOpen?: boolean;
  title?: string;
  description?: string;
  content: React.ComponentType<{ hide?: () => void }>;
  contentProps?: Record<string, unknown>;
  isDraggable?: boolean;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
  defaultPosition?: { x: number; y: number };
  onClose?: (id: string) => void;
  unstyled?: boolean;
  showOverlay?: boolean;
  containerClassName?: string;
  ref?: React.Ref<ManagedDialogRef>;
}

export interface ManagedDialogRef {
  updatePosition: (position: Position) => void;
}

const _updatePosition = (
  contentNode: HTMLElement,
  desiredPosition: { x: number; y: number },
  setCurrentPosition: React.Dispatch<React.SetStateAction<Position>>
) => {
  if (!contentNode || !desiredPosition) {
    return;
  }

  // Build a new position object: desiredPosition is often the defaultPosition
  // prop or the current state value, and mutating it in place would leave the
  // state reference unchanged, so React (and compiler-memoized JSX) would not
  // re-render with the adjusted coordinates. The functional update bails out
  // (returns the previous reference) when the coordinates are unchanged, so
  // repeated calls - e.g. from a ref callback that is re-attached on every
  // render - cannot start a setState loop.
  const boundingClientRect = contentNode.getBoundingClientRect();
  let { x, y } = desiredPosition;
  if (boundingClientRect.bottom > window.innerHeight) {
    y = y - boundingClientRect.height;
  }
  if (boundingClientRect.right > window.innerWidth) {
    x = x - boundingClientRect.width;
  }
  setCurrentPosition(prev => (prev && prev.x === x && prev.y === y ? prev : { x, y }));
};

const ManagedDialog = ({
  id,
  isOpen,
  title,
  content: DialogContentComponent,
  contentProps,
  isDraggable,
  shouldCloseOnEsc = false,
  shouldCloseOnOverlayClick = false,
  showOverlay = true,
  defaultPosition,
  onClose,
  unstyled,
  containerClassName,
  ref,
}: ManagedDialogProps) => {
  const [currentPosition, setCurrentPosition] = useState(defaultPosition);
  const [contentNode, setContentNode] = useState<HTMLElement | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      updatePosition: (position: Position) => {
        _updatePosition(contentNode, position, setCurrentPosition);
      },
    }),
    []
  );


  // When a default position is provided, the assumption is that the position
  // is respected unless the position chosen results in the dialog being
  // clipped off-screen (i.e. part of the dialog is rendered outside the browser
  // window). When the dialog is clipped it will be repositioned about
  // the default position such that it is no longer clipped. To avoid a flash
  // during the reposition, we initially hide the dialog.
  const [contentVisibility, setContentVisibility] = useState(
    defaultPosition ? 'invisible' : 'visible'
  );

  // Capture the dialog's DOM node. The ref chain below this component is
  // re-created on renders (useDraggable composes an unmemoized ref), so this
  // callback can fire repeatedly with the same node - the functional update
  // bails to the previous reference in that case, so no render is scheduled.
  const contentRef = useCallback(node => {
    if (node) {
      setContentNode(prev => (prev === node ? prev : node));
    }
  }, []);

  // Reposition an explicitly positioned dialog so it is not clipped by the
  // window, then reveal it. A layout effect runs after the dialog content is
  // laid out (so the measured size is real) but before paint (so there is no
  // visible jump). Note that if the dialog is larger than the window (in
  // either dimension), the dialog will still be clipped in some manner.
  useLayoutEffect(() => {
    if (!contentNode) {
      return;
    }
    _updatePosition(contentNode, defaultPosition, setCurrentPosition);
    setContentVisibility('visible');
  }, [contentNode, defaultPosition]);

  return (
    <Dialog
      open={isOpen}
      modal={false} // keep modal behavior off for independent windows
      onOpenChange={open => {
        if (!open) {
          onClose(id);
        }
      }}
      isDraggable={isDraggable}
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      showOverlay={showOverlay}
    >
      <DialogContent
        ref={contentRef}
        className={cn(unstyled ? 'p-0' : '', containerClassName, contentVisibility)}
        unstyled={unstyled}
        style={{
          ...(currentPosition
            ? {
                position: 'fixed',
                left: `${currentPosition.x}px`,
                top: `${currentPosition.y}px`,
                transform: 'translate(0, 0)',
                margin: 0,
                animation: 'none',
                transition: 'none',
              }
            : {}),
        }}
      >
        {!unstyled && <DialogHeader>{title && <DialogTitle>{title}</DialogTitle>}</DialogHeader>}
        <DialogContentComponent
          {...contentProps}
          hide={() => onClose(id)}
        />
      </DialogContent>
    </Dialog>
  );
};

ManagedDialog.displayName = 'ManagedDialog';

export default ManagedDialog;
