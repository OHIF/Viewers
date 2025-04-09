import { useUserAuthentication } from '@ohif/ui-next';

export const PrivateRoute = ({ children, handleUnauthenticated }) => {
  const [{ user, enabled }] = useUserAuthentication();

  if (enabled && !user) {
    return handleUnauthenticated();
  }

  return children;
};

export default PrivateRoute;
