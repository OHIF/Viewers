import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/Dialog/Dialog';

let globalZIndex = 50;

export const getNextZIndex = () => {
  globalZIndex += 1;
  return globalZIndex;
};

export interface ManagedDialogProps {
  id: string;
  isOpen?: boolean;
  title?: string;
  description?: string;
  content: React.ComponentType<{ onDismiss?: () => void }>;
  contentProps?: Record<string, unknown>;
  movable?: boolean;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
  initialPosition?: { x: number; y: number };
  onClose?: (id: string) => void;
}

const ManagedDialog: React.FC<ManagedDialogProps> = ({
  id,
  isOpen,
  title,
  description,
  content: DialogContentComponent,
  contentProps,
  movable,
  shouldCloseOnEsc = false,
  shouldCloseOnOverlayClick = false,
  initialPosition,
  onClose,
}) => {
  const [zIndex, setZIndex] = useState(getNextZIndex());

  const bringToFront = () => {
    setZIndex(getNextZIndex());
  };

  return (
    <Dialog
      open={isOpen}
      modal={false} // keep modal behavior off for independent windows
      onOpenChange={open => {
        if (!open) {
          onClose(id);
        }
      }}
      movable={movable}
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      <DialogContent
        // Combine initial position with dynamic z-index.
        style={{
          ...(initialPosition
            ? {
                position: 'fixed',
                left: `${initialPosition.x}px`,
                top: `${initialPosition.y}px`,
              }
            : {}),
          zIndex, // apply our dynamic z-index
        }}
        // We'll pass our bringToFront function as a pointer down handler.
        onPointerDown={bringToFront}
      >
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <DialogContentComponent
          {...contentProps}
          hide={() => onClose(id)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ManagedDialog;
