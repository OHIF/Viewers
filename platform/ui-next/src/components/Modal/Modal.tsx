import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../Dialog';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  movable?: boolean;
  noOverlay?: boolean;
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
  noOverlay = false,
  shouldCloseOnEsc = true,
  shouldCloseOnOverlayClick = true,
  containerClassName = '',
  contentClassName = '',
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      movable={movable}
      noOverlay={noOverlay}
      shouldCloseOnEsc={shouldCloseOnEsc}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
    >
      <DialogContent className={cn('flex max-h-[80vh] flex-col', 'max-w-3xl', containerClassName)}>
        <div className={cn('flex flex-1 flex-col', contentClassName)}>
          {title && (
            <DialogHeader className={cn('mb-4 text-2xl font-semibold leading-none')}>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          )}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
