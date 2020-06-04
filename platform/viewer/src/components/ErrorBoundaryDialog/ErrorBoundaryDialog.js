import React from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary } from '@ohif/ui';
import { servicesManager } from './../../App';

const { UIModalService } = servicesManager.services;

const ErrorBoundaryDialog = ({ context, children }) => {
  const handleOnError = (error, componentStack) => {
    const ErrorDialog = () => (
      <div className="ErrorFallback" role="alert">
        <div>
          <h3>
            {context}: <span>{error.message}</span>
          </h3>
        </div>
        <pre>{componentStack}</pre>
      </div>
    );

    UIModalService.show({
      content: ErrorDialog,
      title: `${context}: ${error.message}`,
    });
  };

  const fallbackComponent = () => (
    <div className="ErrorFallback" role="alert">
      <p>
        Error rendering {context}. <br /> Check the browser console for more
        details.
      </p>
    </div>
  );

  return (
    <ErrorBoundary
      fallbackComponent={fallbackComponent}
      context={context}
      onError={handleOnError}
    >
      {children}
    </ErrorBoundary>
  );
};

ErrorBoundaryDialog.propTypes = {
  context: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default ErrorBoundaryDialog;
