import React from 'react';
import Draggable from 'react-draggable';
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
}

const NewModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  movable = false,
  containerClassName = '',
  contentClassName = '',
}) => {
  const modalBody = (
    <>
      {title && (
        <DialogHeader className={cn('mb-4 text-2xl font-semibold leading-none')}>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
      )}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className={cn('flex max-h-[80vh] flex-col', 'max-w-3xl', containerClassName)}>
        {movable ? (
          <Draggable handle=".drag-handle">
            <div className={cn('flex flex-1 flex-col', contentClassName)}>{modalBody}</div>
          </Draggable>
        ) : (
          <div className={cn('flex flex-1 flex-col', contentClassName)}>{modalBody}</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewModal;
