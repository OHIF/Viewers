import React from 'react';
import PropTypes from 'prop-types';
import { Icons } from '../Icons';
import { Button } from '../Button';

const ErrorDisplay = ({ error, onRetry, title = 'Error' }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black p-6 text-center text-white">
      <div className="mb-4 rounded-full bg-red-900/20 p-4">
        <Icons.Alert className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-6 max-w-md text-gray-400">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="default"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

ErrorDisplay.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func,
  title: PropTypes.string,
};

export default ErrorDisplay;
