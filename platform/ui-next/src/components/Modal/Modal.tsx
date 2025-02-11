import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Dialog';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  movable?: boolean;
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
  movable = false,
  shouldCloseOnEsc = true,
  shouldCloseOnOverlayClick = true,
  containerClassName,
  contentClassName,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      movable={movable}
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      <DialogContent className={cn('flex max-h-[80vh] flex-col', 'max-w-3xl', containerClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className={cn('mt-2', contentClassName)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
