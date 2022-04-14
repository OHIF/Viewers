import React, { useState } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import PropTypes from 'prop-types';
import Modal from '../Modal';

const isProduction = process.env.NODE_ENV === 'production';

const DefaultFallback = ({ error, componentStack, context, resetErrorBoundary, fallbackRoute }) => {
  const title = `Something went wrong${!isProduction && ` in ${context}`}.`;
  const subtitle = `Sorry, something went wrong there. Try again.`;
  return (
    <div className="ErrorFallback bg-primary-dark w-full h-full" role="alert">
      <p className="text-primary-light text-xl">{title}</p>
      <p className="text-primary-light text-base">{subtitle}</p>
      {!isProduction && (
        <div className="rounded-md bg-secondary-dark p-5 mt-5">
          <pre className="text-primary-light">Context: {context}</pre>
          <pre className="text-primary-light">Error Message: {error.message}</pre>
          <pre className="text-primary-light">Stack: {componentStack}</pre>
        </div>
      )}
    </div>
  );
};

const noop = () => { };

DefaultFallback.propTypes = {
  error: PropTypes.object.isRequired,
  resetErrorBoundary: PropTypes.func,
  componentStack: PropTypes.string,
};

DefaultFallback.defaultProps = {
  resetErrorBoundary: noop
};

const ErrorBoundary = ({
  context,
  onReset,
  onError,
  fallbackComponent: FallbackComponent,
  children,
  fallbackRoute,
  isPage
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const onErrorHandler = (error, componentStack) => {
    console.error(`${context} Error Boundary`, error, componentStack, context);
    onError(error, componentStack, context);
  };

  const onResetHandler = (...args) => onReset(...args);

  const withModal = (Component) => props => (
    <Modal
      closeButton
      shouldCloseOnEsc
      isOpen={isOpen}
      title={'Something went wrong'}
      onClose={() => {
        setIsOpen(false);
        if (fallbackRoute && typeof window !== 'undefined') {
          window.location = fallbackRoute;
        }
      }}
    >
      <Component {...props} />
    </Modal>
  );

  const Fallback = isPage ? FallbackComponent : withModal(FallbackComponent);

  return (
    <ReactErrorBoundary
      fallbackRender={props => (
        <Fallback
          {...props}
          context={context}
          fallbackRoute={fallbackRoute}
        />
      )}
      onReset={onResetHandler}
      onError={onErrorHandler}
    >
      {children}
    </ReactErrorBoundary>
  );
};

ErrorBoundary.propTypes = {
  context: PropTypes.string,
  onReset: PropTypes.func,
  onError: PropTypes.func,
  fallbackComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  children: PropTypes.node.isRequired,
  fallbackRoute: PropTypes.string
};

ErrorBoundary.defaultProps = {
  context: 'OHIF',
  onReset: noop,
  onError: noop,
  fallbackComponent: DefaultFallback,
  fallbackRoute: null
};

export default ErrorBoundary;
