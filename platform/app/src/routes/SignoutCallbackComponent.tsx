import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SignoutCallbackComponentProps {
  userManager: object;
}

function SignoutCallbackComponent({
  userManager
}: SignoutCallbackComponentProps) {
  const navigate = useNavigate();

  const onRedirectSuccess = (/* user */) => {
    const { pathname, search = '' } = JSON.parse(sessionStorage.getItem('ohif-redirect-to'));

    navigate(`${pathname}?${search}`);
  };

  const onRedirectError = error => {
    throw new Error(error);
  };

  userManager
    .signoutRedirectCallback()
    .then(user => onRedirectSuccess(user))
    .catch(error => onRedirectError(error));

  return null;
}

export default SignoutCallbackComponent;
