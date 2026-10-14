import React, { useEffect } from 'react';

function CallbackPage({ userManager, onRedirectSuccess }) {
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
