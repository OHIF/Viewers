import React from 'react';
import { XylexaLoginPage } from './XylexaLoginPage';
import { AuthenticationContextProvider } from '@xylexa/xylexa-app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const XylexaApp = props => {
  return (
    <AuthenticationContextProvider>
      <QueryClientProvider client={queryClient}>
        <XylexaLoginPage
          defaultExtensions={props.defaultExtensions}
          defaultModes={props.defaultModes}
        />
        <ToastContainer />
      </QueryClientProvider>
    </AuthenticationContextProvider>
  );
};
