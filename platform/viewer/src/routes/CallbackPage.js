import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function CallbackPage({ userManager }) {
  const navigate = useNavigate();

  const onRedirectSuccess = (/* user */) => {
    const { pathname, search = '' } = JSON.parse(
      sessionStorage.getItem('ohif-redirect-to')
    );

    //this.props.history.push({ pathname, search });
    console.log({ pathname, search });
    navigate(`${pathname}?${search}`);
  };

  const onRedirectError = error => {
    throw new Error(error);
  };

  userManager
    .signinRedirectCallback()
    .then(user => onRedirectSuccess(user))
    .catch(error => onRedirectError(error));

  // todo: add i18n
  return <div>Redirecting...</div>;
}

CallbackPage.propTypes = {
  userManager: PropTypes.object.isRequired,
};

export default CallbackPage;
