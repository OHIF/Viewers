import * as React from 'react';
import './tailwind.css';
import './theme.css';
import PropTypes from 'prop-types';

const Wrapper = ({ children }) => <React.Fragment>{children}</React.Fragment>;

Wrapper.propTypes = {
  children: PropTypes.node,
};

export default Wrapper;
