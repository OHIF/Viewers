import React from 'react';
import { Toaster as Sonner } from 'sonner';
import { Icons } from '../Icons';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      loadingIcon={<Icons.LoadingSpinner />}
      icons={{
        warning: <Icons.StatusWarning />,
        info: <Icons.Info className="text-secondary-foreground" />,
        success: <Icons.StatusSuccess />,
        error: <Icons.StatusError />,
      }}
      theme="dark"
      richColors="true"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:border-background group-[.toaster]:shadow-lg',
          info: 'group-[.toast] group-[.toaster]:!bg-popover group-[.toaster]:!text-foreground group-[.toaster]:!border-background',
          error: 'group-[.toaster]:!border-background',
          success: 'group-[.toaster]:!border-background',
          warning: 'group-[.toaster]:!border-background',
          description: 'group-[.toast]:text-secondary-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
