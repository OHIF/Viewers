import React from 'react';
import PropTypes from 'prop-types';

import './tailwind.css';
import './theme.css';

const Wrapper = ({ children }) => <>{children}</>;

Wrapper.propTypes = {
  children: PropTypes.node,
};

export default Wrapper;
