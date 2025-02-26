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
        style: {
          width: '430px', // Set a maximum width
          right: '8px',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
