import React, { useState } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

import Modal from '../Modal';
import Icon from '../Icon';
import IconButton from '../IconButton';

const isProduction = process.env.NODE_ENV === 'production';

const DefaultFallback = ({ error, context, resetErrorBoundary = () => {}, fallbackRoute }) => {
  const { t } = useTranslation('ErrorBoundary');
  const [showDetails, setShowDetails] = useState(false);
  const title = `${t('Something went wrong')}${!isProduction && ` ${t('in')} ${context}`}.`;
  const subtitle = t('Sorry, something went wrong there. Try again.');
  return (
    <div
      className="ErrorFallback bg-primary-dark h-full w-full"
      role="alert"
    >
      <p className="text-primary-light text-xl">{title}</p>
      <p className="text-primary-light text-base">{subtitle}</p>
      {!isProduction && (
        <div className="bg-secondary-dark mt-5 space-y-2 rounded-md p-5 font-mono">
          <p className="text-primary-light">
            {t('Context')}: {context}
          </p>
          <p className="text-primary-light">
            {t('Error Message')}: {error.message}
          </p>

          <IconButton
            variant="contained"
            color="inherit"
            size="initial"
            className="text-primary-active"
            onClick={() => setShowDetails(!showDetails)}
          >
            <React.Fragment>
              <div>{t('Stack Trace')}</div>
              <Icon
                width="15px"
                height="15px"
                name="chevron-down"
              />
            </React.Fragment>
          </IconButton>

          {showDetails && (
            <pre className="text-primary-light whitespace-pre-wrap px-4">Stack: {error.stack}</pre>
          )}
        </div>
      )}
    </div>
  );
};

DefaultFallback.propTypes = {
  error: PropTypes.object.isRequired,
  resetErrorBoundary: PropTypes.func,
  componentStack: PropTypes.string,
};

const ErrorBoundary = ({
  context = 'OHIF',
  onReset = () => {},
  onError = () => {},
  fallbackComponent: FallbackComponent = DefaultFallback,
  children,
  fallbackRoute = null,
  isPage,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const onErrorHandler = (error, componentStack) => {
    console.error(`${context} Error Boundary`, error, componentStack, context);
    onError(error, componentStack, context);
  };

  const onResetHandler = (...args) => onReset(...args);

  const withModal = Component => props => (
    <Modal
      closeButton
      shouldCloseOnEsc
      isOpen={isOpen}
      title={i18n.t('ErrorBoundary:Something went wrong')}
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
  fallbackRoute: PropTypes.string,
};

export default ErrorBoundary;
