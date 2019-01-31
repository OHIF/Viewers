import React from 'react';
import PropTypes from "prop-types";

function OHIFComponentPlugin(props) {
  return (<React.Fragment>{props.children}</React.Fragment>);
}

OHIFComponentPlugin.propTypes = {
  id: PropTypes.string.isRequired,
  init: PropTypes.func.isRequired,
  destroy: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default OHIFComponentPlugin;
