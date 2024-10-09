import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '../../lib/utils';
import { Icons } from '../Icons';

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  showArrows?: boolean;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, showArrows = false, ...props }, ref) => {
  const [showBottomArrow, setShowBottomArrow] = React.useState(false);
  const [showTopArrow, setShowTopArrow] = React.useState(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = React.useCallback(() => {
    if (viewportRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = viewportRef.current;
      setShowBottomArrow(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight);
      setShowTopArrow(scrollTop > 0);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative h-full overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className="h-full w-full rounded-[inherit]"
        onScroll={checkScroll}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
      {showArrows && showTopArrow && (
        <div className="from-background via-background/80 pointer-events-none absolute -top-1 left-0 right-0 flex h-8 items-center justify-center bg-gradient-to-b to-transparent">
          <Icons.ChevronOpen className="text-foreground/50 h-8 w-8 rotate-180" />
        </div>
      )}
      {showArrows && showBottomArrow && (
        <div className="from-background via-background/80 pointer-events-none absolute -bottom-1 left-0 right-0 flex h-8 items-center justify-center bg-gradient-to-t to-transparent">
          <Icons.ChevronOpen className="text-foreground/50 h-8 w-8" />
        </div>
      )}
    </ScrollAreaPrimitive.Root>
  );
});

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[2px]',
      orientation === 'horizontal' && 'h-2 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="bg-input relative flex-1 rounded-full" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
