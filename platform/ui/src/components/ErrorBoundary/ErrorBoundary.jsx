import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import PropTypes from 'prop-types';
import './ErrorFallback.css';

const isProduction = process.env.NODE_ENV === 'production';

const ErrorFallback = ({ error, componentStack, resetErrorBoundary }) => {
  return (
    <div className="ErrorFallback" role="alert">
      <p>Something went wrong.</p>
      {isProduction && (
        <span>Sorry, something went wrong there. Try again.</span>
      )}
      {!isProduction && <pre>{error.message}</pre>}
      {!isProduction && <pre>{componentStack}</pre>}
    </div>
  );
};

ErrorFallback.propTypes = {
  resetErrorBoundary: PropTypes
};

const ErrorBoundary = ({
  context = 'RCT',
  onReset = () => { },
  onError = () => { },
  fallbackComponent,
  children
}) => {
  const onErrorHandler = (error, componentStack) => {
    console.error(`${context} Error Boundary`, error, componentStack);
    onError(error, componentStack);
  };

  const onResetHandler = () => {
    onReset();
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallbackComponent || ErrorFallback}
      onReset={onResetHandler}
      onError={onErrorHandler}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
