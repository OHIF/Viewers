import React from 'react';
import PropTypes from 'prop-types';

export function ViewportErrorIndicator(props) {
  const details = props.details || 'An error has occurred.';
  return (
    <div
      className="loadingIndicator"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 'auto',
        textAlign: 'center',
        pointerEvents: 'none',
        color: 'var(--active-color)',
      }}
    >
      <p className="title">Error</p>
      {/*<p className="description">An error has occurred.</p>*/}
      <p className="details">{details}</p>
    </div>
  );
}

ViewportErrorIndicator.propTypes = {
  details: PropTypes.string,
};

export default ViewportErrorIndicator;
