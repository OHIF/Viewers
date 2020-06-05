import React, { useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { ErrorBoundary, Icon } from '@ohif/ui';
import { servicesManager } from './../../App';

import './ErrorBoundaryDialog.css';

const { UIModalService } = servicesManager.services;

const ErrorBoundaryDialog = ({ context, children }) => {
  const handleOnError = (error, componentStack) => {
    const ErrorDialog = () => {
      const [open, setOpen] = useState(false);

      return (
        <div className="ErrorFallback" role="alert">
          <div className="ErrorBoundaryDialog">
            <h3 className="ErrorBoundaryDialogTitle">
              {context}: <span>{error.message}</span>
            </h3>
          </div>
          <button
            className="btn btn-primary btn-sm ErrorBoundaryDialogButton"
            onClick={() => setOpen(s => !s)}
          >
            <Icon
              name="chevron-down"
              className={classnames('ErrorBoundaryDialogIcon', {
                opened: open,
              })}
            />
            Stack Trace
          </button>

          {open && <pre>{componentStack}</pre>}
        </div>
      );
    };

    UIModalService.show({
      content: ErrorDialog,
      title: `Something went wrong in ${context}`,
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
