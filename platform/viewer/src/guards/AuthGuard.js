import React, { useContext } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import UserManagerContext from '../context/UserManagerContext';
import { useSelector } from 'react-redux';

const AuthGuard = ({ userNotLoggedIn, children }) => {
  // const userManager = useContext(UserManagerContext);
  // const user = useSelector(state => state.oidc.user);
  // const isAuthenticated = userManager && (!user || user.expired);

  // const isAuthenticated = false;
  if (userNotLoggedIn) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};

AuthGuard.propTypes = {
  children: PropTypes.node,
};

export default AuthGuard;
