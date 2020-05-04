import React from 'react';
import PropTypes from 'prop-types';

const Dialog = ({ children }) => {
  return <div className="absolute top-0 left-0">{children}</div>;
};

Dialog.propTypes = {
  children: PropTypes.node,
};

export default Dialog;
