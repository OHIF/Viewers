import React from 'react';
import PropTypes from 'prop-types';
import getSvg from './getSvg';

const Svg = ({ name, ...otherProps }) => {
  return <React.Fragment>{getSvg(name, { ...otherProps })}</React.Fragment>;
};

Svg.propTypes = {
  name: PropTypes.string.isRequired,
};

export default Svg;
