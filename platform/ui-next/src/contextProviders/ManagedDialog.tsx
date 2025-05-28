import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/Dialog/Dialog';
import { cn } from '../lib/utils';

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
}

const ManagedDialog: React.FC<ManagedDialogProps> = ({
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
}) => {
  // When a default position is provided, the assumption is that the position
  // is respected unless the position chosen results in the dialog being
  // clipped off-screen (i.e. part of the dialog is rendered outside the browser
  // window). When the dialog is clipped it will be repositioned about
  // the default position such that it is no longer clipped. To avoid a flash
  // during the reposition, we initially hide the dialog.
  const [contentVisibility, setContentVisibility] = useState(
    defaultPosition ? 'invisible' : 'visible'
  );

  // The callback to reposition an explicitly positioned dialog. Note that
  // if the dialog is larger than the window (in either dimension), the
  // dialog will still be clipped in some manner.
  const contentRef = useCallback(
    contentNode => {
      if (!contentNode) {
        return;
      }

      const boundingClientRect = contentNode.getBoundingClientRect();
      if (boundingClientRect.bottom > window.innerHeight) {
        defaultPosition.y = defaultPosition.y - boundingClientRect.height;
      }
      if (boundingClientRect.right > window.innerWidth) {
        defaultPosition.x = defaultPosition.x - boundingClientRect.width;
      }
      setContentVisibility('visible');
    },
    [defaultPosition]
  );

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
          ...(defaultPosition
            ? {
                position: 'fixed',
                left: `${defaultPosition.x}px`,
                top: `${defaultPosition.y}px`,
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

export default ManagedDialog;
