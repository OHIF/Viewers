import React from 'react';
import PropTypes from 'prop-types';

const Dialog = ({ children }) => {
  return <div>{children}</div>;
};

Dialog.propTypes = {
  children: PropTypes.node,
};

export default Dialog;
