import React, { useContext } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import UserManagerContext from '../context/UserManagerContext';
import { useSelector } from 'react-redux';

const GuestGuard = ({ children }) => {
  const userManager = useContext(UserManagerContext);
  const user = useSelector(state => state.oidc.user);

  const isAuthenticated = userManager && (!user || user.expired);
  // const isAuthenticated = true;
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
};

GuestGuard.propTypes = {
  children: PropTypes.node,
};

export default GuestGuard;
