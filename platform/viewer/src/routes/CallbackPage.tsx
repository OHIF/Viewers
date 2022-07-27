import React from 'react';
import PropTypes from 'prop-types';

function CallbackPage({ userManager, onRedirectSuccess }) {
  const onRedirectError = error => {
    throw new Error(error);
  };

  userManager
    .signinRedirectCallback()
    .then(user => onRedirectSuccess(user))
    .catch(error => onRedirectError(error));

  return null;
}

CallbackPage.propTypes = {
  userManager: PropTypes.object.isRequired,
};

export default CallbackPage;
