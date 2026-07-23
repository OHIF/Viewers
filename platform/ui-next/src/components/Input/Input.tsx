import * as React from 'react';

import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input text-foreground bg-background hover:bg-primary/10 placeholder:text-muted-foreground focus-visible:ring-ring flex h-7 w-full rounded border px-2 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
