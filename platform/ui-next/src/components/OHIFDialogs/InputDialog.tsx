import * as React from 'react';
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
  return <div className={cn('max-w-md p-4', className)}>{children}</div>;
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

/** Attach all subcomponents as static properties of InputDialog */
InputDialog.InputPlaceholder = InputPlaceholder;
