import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/Dialog/Dialog';

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
  defaultPosition?: { x: number; y: number };
  onClose?: (id: string) => void;
  unstyled?: boolean;
}

const ManagedDialog: React.FC<ManagedDialogProps> = ({
  id,
  isOpen,
  title,
  content: DialogContentComponent,
  contentProps,
  movable,
  shouldCloseOnEsc = false,
  shouldCloseOnOverlayClick = false,
  defaultPosition,
  onClose,
  unstyled,
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
      movable={movable}
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      <DialogContent
        className={unstyled ? 'p-0' : ''}
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
