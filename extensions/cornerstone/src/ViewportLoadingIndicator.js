import React from 'react';

import PropTypes from 'prop-types';

const ViewportLoadingIndicator = ({ error }) => {
  if (error) {
    return (
      <>
        <div className="bg-black h-full w-full absolute opacity-50"></div>
        <div className="text-primary-light text-xl font-thin">
          <h4>Error Loading Image</h4>
          <p>An error has occurred.</p>
          <p>{error.message}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-black h-full w-full absolute opacity-50"></div>
      <div className="absolute transparent w-full h-full flex items-center justify-center">
        <p className="text-primary-light text-xl font-thin">
          Loading...
      </p>
      </div>
    </>
  );
};

ViewportLoadingIndicator.propTypes = {
  percentComplete: PropTypes.number,
  error: PropTypes.object,
};

ViewportLoadingIndicator.defaultProps = {
  percentComplete: 0,
  error: null,
};

export default ViewportLoadingIndicator;
