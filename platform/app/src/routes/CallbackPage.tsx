import React, { useEffect } from 'react';

interface CallbackPageProps {
  userManager: object;
}

function CallbackPage({
  userManager,
  onRedirectSuccess
}: CallbackPageProps) {
  const onRedirectError = error => {
    throw new Error(error);
  };

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then(user => onRedirectSuccess(user))
      .catch(error => onRedirectError(error));
  }, [userManager, onRedirectSuccess]);

  return null;
}

export default CallbackPage;
