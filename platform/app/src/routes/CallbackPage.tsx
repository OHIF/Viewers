import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

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

CallbackPage.propTypes = {
  userManager: PropTypes.object.isRequired,
};

export default CallbackPage;
