import React from 'react';
import { Route, Outlet } from 'react-router-dom';
import { useUserAuthentication } from '@ohif/ui';

export const PrivateRoute = ({ children, handleUnauthenticated }) => {
  const [{ user, enabled }] = useUserAuthentication();

  if (enabled && !user) {
    return handleUnauthenticated();
  }

  return children;
};

export default PrivateRoute;
