import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

import { cn } from '../../lib/utils';

interface DialogContextValue {
  movable?: boolean;
  noOverlay?: boolean;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
}

const DialogContext = React.createContext<DialogContextValue>({
  movable: false,
  noOverlay: false,
  shouldCloseOnEsc: true,
  shouldCloseOnOverlayClick: true,
});

interface DialogRootProps extends DialogPrimitive.DialogProps {
  movable?: boolean;
  noOverlay?: boolean;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
}

const Dialog = ({
  movable,
  noOverlay,
  shouldCloseOnEsc = true,
  shouldCloseOnOverlayClick = true,
  ...props
}: DialogRootProps) => (
  <DialogContext.Provider
    value={{ movable, noOverlay, shouldCloseOnEsc, shouldCloseOnOverlayClick }}
  >
    <DialogPrimitive.Root {...props} />
  </DialogContext.Provider>
);

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, ...props }, ref) => {
  const { movable, noOverlay, shouldCloseOnEsc, shouldCloseOnOverlayClick } =
    React.useContext(DialogContext);

  const offsetRef = React.useRef({ x: 0, y: 0 });

  const dragState = React.useRef<{
    startX: number;
    startY: number;
    initialOffset: { x: number; y: number };
  } | null>(null);

  const internalRef = React.useRef<HTMLDivElement>(null);
  const setRefs = (node: HTMLDivElement) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) {
      return;
    }

    if (internalRef.current) {
      internalRef.current.style.transition = 'none';
    }
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialOffset: { ...offsetRef.current },
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragState.current) {
      return;
    }

    const deltaX = e.clientX - dragState.current.startX;
    const deltaY = e.clientY - dragState.current.startY;
    const newOffset = {
      x: dragState.current.initialOffset.x + deltaX,
      y: dragState.current.initialOffset.y + deltaY,
    };

    offsetRef.current = newOffset;
    if (internalRef.current) {
      internalRef.current.style.transform = `translate(-50%, -50%) translate(${newOffset.x}px, ${newOffset.y}px)`;
    }
  };

  const handlePointerUp = () => {
    if (internalRef.current) {
      internalRef.current.style.transition = '';
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    dragState.current = null;
  };

  // When not movable, Tailwind centers the dialog.
  // When movable, we remove the built‑in centering so our inline transform takes over.
  const contentClassName = cn(
    'bg-muted data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg gap-4 p-4 shadow-lg duration-200 sm:rounded-lg',
    !movable ? 'translate-x-[-50%] translate-y-[-50%]' : '',
    className
  );

  const initialTransform = movable
    ? `translate(-50%, -50%) translate(${offsetRef.current.x}px, ${offsetRef.current.y}px)`
    : undefined;
  const style = movable ? { ...props.style, transform: initialTransform } : props.style;

  const content = (
    <DialogPrimitive.Content
      ref={setRefs}
      className={contentClassName}
      {...props}
      style={style}
      onPointerDown={movable ? handlePointerDown : props.onPointerDown}
      onEscapeKeyDown={event => {
        if (!shouldCloseOnEsc) {
          event.preventDefault();
        }
      }}
      onInteractOutside={event => {
        if (!shouldCloseOnOverlayClick) {
          event.preventDefault();
        }
      }}
    >
      {children}
      <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none">
        <Cross2Icon className="text-muted-foreground h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  );

  return (
    <DialogPortal>
      {!noOverlay && <DialogOverlay />}
      {content}
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'drag-handle relative flex select-none flex-col space-y-1.5 text-center sm:text-left',
        className
      )}
      {...props}
    >
      {props.children}
    </div>
  );
};
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-primary-light text-xl font-normal leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-base', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
