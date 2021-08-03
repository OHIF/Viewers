import React from 'react';
import PropTypes from 'prop-types';

export function ViewportLoadingIndicator(props) {
  return (
    <div
      className="loading-indicator"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      Loading {props.percentComplete}
    </div>
  );
}

ViewportLoadingIndicator.propTypes = {
  percentComplete: PropTypes.number,
};

export default ViewportLoadingIndicator;
