import * as React from 'react';
import { DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { cn } from '../../lib/utils';

interface InputDialogProps {
  /** All subcomponents (`InputTitle`, `InputPlaceholder`, `InputActions`) go here. */
  children: React.ReactNode;
  className?: string;
}

/**
 * A small dialog that contains a title, one or more inputs (via `InputPlaceholder`),
 * and a set of actions (via `InputActions`).
 */
export function InputDialog({ children, className }: InputDialogProps) {
  return <DialogContent className={cn('max-w-md p-4', className)}>{children}</DialogContent>;
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
          className="min-w-[80px]"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="min-w-[80px]"
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
