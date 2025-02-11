import React from 'react';
import Draggable from 'react-draggable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../Dialog';
import { X } from 'lucide-react';

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
        <DialogHeader className="drag-handle flex items-center justify-between border-b p-4">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogClose
            onClick={onClose}
            className="cursor-pointer rounded p-2 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
      )}
      <div className="p-4">{children}</div>
    </>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
    >
      <DialogContent className={containerClassName}>
        {movable ? (
          <Draggable handle=".drag-handle">
            <div className={contentClassName}>{modalBody}</div>
          </Draggable>
        ) : (
          <div className={contentClassName}>{modalBody}</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewModal;
