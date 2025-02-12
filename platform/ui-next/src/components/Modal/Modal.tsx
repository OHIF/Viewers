import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Dialog';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  shouldCloseOnEsc = true,
  shouldCloseOnOverlayClick = true,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      <DialogContent className={cn('flex max-h-[80vh] flex-col')}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className={cn('mt-2')}>{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
