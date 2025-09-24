import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

function SignoutCallbackComponent({ userManager }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onRedirectSuccess = (/* user */) => {
      const { pathname, search = '' } = JSON.parse(
        sessionStorage.getItem('ohif-redirect-to')
      );

      navigate(`${pathname}?${search}`);
    };

    const onRedirectError = error => {
      throw new Error(error);
    };

    userManager
      .signoutRedirectCallback()
      .then(user => onRedirectSuccess(user))
      .catch(error => onRedirectError(error));
  }, [navigate, userManager]);

  return null;
}

SignoutCallbackComponent.propTypes = {
  userManager: PropTypes.object.isRequired,
};

export default SignoutCallbackComponent;
