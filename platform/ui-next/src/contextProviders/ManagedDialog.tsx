import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
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

export interface ManagedDialogRef {
  updatePosition: (position: { x: number; y: number }) => void;
}

const ManagedDialog = forwardRef<ManagedDialogRef, ManagedDialogProps>(
  (
    {
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
    },
    ref
  ) => {
    const [currentPosition, setCurrentPosition] = useState(defaultPosition);

    useImperativeHandle(
      ref,
      () => ({
        updatePosition: (position: { x: number; y: number }) => {
          setCurrentPosition(position);
        },
      }),
      []
    );

    useEffect(() => {
      setCurrentPosition(defaultPosition);
    }, [defaultPosition]);
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
          className={cn(unstyled ? 'p-0' : '', containerClassName)}
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
  }
);

ManagedDialog.displayName = 'ManagedDialog';

export default ManagedDialog;
