import React from 'react';
import { useUserAuthentication } from '@ohif/ui';

export const PrivateRoute = ({ children, handleUnauthenticated }) => {
  const [{ user, enabled }] = useUserAuthentication();

  if (enabled && !user) {
    return handleUnauthenticated();
  }

  return children;
};

export default PrivateRoute;
