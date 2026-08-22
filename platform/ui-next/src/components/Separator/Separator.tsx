import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

import { cn } from '../../lib/utils';

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  thickness?: string;
};

const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  thickness = '1px',
  ref,
  ...props
}: SeparatorProps) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'bg-border shrink-0',
      orientation === 'horizontal' ? `h-[${thickness}] w-full` : `h-full w-[${thickness}]`,
      className
    )}
    {...props}
  />
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
