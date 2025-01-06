import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const toggleVariants = cva(
  'inline-flex items-center justify-center rounded-md text-primary-foreground/80 font-medium transition-colors hover:bg-primary/20 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary/20 data-[state=on]:text-highlight',
  {
    variants: {
      variant: {
        default: 'bg-transparent hover:text-primary',
        outline: 'border border-input hover:bg-primary/20 hover:text-primary-foreground',
        tool: [
          'bg-transparent text-foreground', // default
          'hover:bg-background hover:text-primary', // hover
          'data-[state=on]:bg-highlight data-[state=on]:text-background data-[state=on]:hover:bg-highlight/50 ', // active
        ].join(' '),
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 px-2',
        lg: 'h-10 px-3',
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
