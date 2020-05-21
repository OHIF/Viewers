import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import './ErrorFallback.css';

const ErrorFallback = ({ error, componentStack, resetErrorBoundary }) => {
  return (
    <div className="ErrorFallback" role="alert">
      <p>Something went wrong.</p>
      <pre>{error.message}</pre>
      <pre>{componentStack}</pre>
    </div>
  )
};

const OHIFErrorBoundary = ({
  context = 'OHIF',
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
    <ErrorBoundary
      FallbackComponent={fallbackComponent || ErrorFallback}
      onReset={onResetHandler}
      onError={onErrorHandler}
    >
      {children}
    </ErrorBoundary>
  );
};

export default OHIFErrorBoundary;
