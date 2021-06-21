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

  // todo: add i18n (or return null?)
  return <div>Redirecting...</div>;
}

CallbackPage.propTypes = {
  userManager: PropTypes.object.isRequired,
};

export default CallbackPage;
