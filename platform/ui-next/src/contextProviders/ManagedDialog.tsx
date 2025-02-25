import React from 'react';
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
        style={{
          ...(defaultPosition
            ? {
                position: 'fixed',
                left: `${defaultPosition.x}px`,
                top: `${defaultPosition.y}px`,
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
};

export default ManagedDialog;
