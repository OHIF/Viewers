import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { cn } from '../../lib/utils';

interface InputDialogProps {
  /** Whether the dialog is open or not. */
  open: boolean;
  /** Called when the dialog should open/close. */
  onOpenChange: (open: boolean) => void;
  /** All subcomponents (`InputTitle`, `InputPlaceholder`, `InputActions`) go here. */
  children: React.ReactNode;
  className?: string;
}

/**
 * A small dialog that contains a title, one or more inputs (via `InputPlaceholder`),
 * and a set of actions (via `InputActions`).
 */
export function InputDialog({ open, onOpenChange, children, className }: InputDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className={cn('max-w-md', className)}>{children}</DialogContent>
    </Dialog>
  );
}

/** Title area for your dialog (e.g., "Segment Label"). */
interface InputTitleProps {
  children: React.ReactNode;
  className?: string;
}
function InputTitle({ children, className }: InputTitleProps) {
  return (
    <DialogHeader>
      <DialogTitle className={cn('text-xl font-normal', className)}>{children}</DialogTitle>
    </DialogHeader>
  );
}

/** An input field where you can specify placeholder text, e.g. "Label". */
interface InputPlaceholderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}
function InputPlaceholder({ className, ...props }: InputPlaceholderProps) {
  return (
    <div className={cn('mt-0', className)}>
      <Input {...props} />
    </div>
  );
}

/**
 * The dialog footer actions. By default, shows "Cancel" (secondary button) and "Save" (primary button).
 * You can supply optional onCancel/onSave handlers.
 */
interface InputActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  className?: string;
}
function InputActions({ onCancel, onSave, className }: InputActionsProps) {
  return (
    <DialogFooter className={cn(className)}>
      <div className="flex w-full items-center justify-end space-x-2">
        <Button
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={onSave}
        >
          Save
        </Button>
      </div>
    </DialogFooter>
  );
}

/** Attach all subcomponents as static properties of InputDialog */
InputDialog.InputTitle = InputTitle;
InputDialog.InputPlaceholder = InputPlaceholder;
InputDialog.InputActions = InputActions;
