import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import './ErrorPage.css';

const ErrorPage = ({ error, title, description, onRetry }) => {
  return (
    <div className="ErrorPage">
      {title && <h3>{title}</h3>}
      <p>{description}</p>
      <Icon
        className="retry-icon"
        name="rotate-right"
        width="25px"
        height="25px"
        onClick={onRetry}
      />
      {error && (
        <div className="error-container">
          <pre>{error.message}</pre>
          <pre>{error.stack}</pre>
        </div>
      )}
    </div>
  );
};

ErrorPage.propTypes = {
  error: PropTypes.object,
  title: PropTypes.string,
  description: PropTypes.string,
  onRetry: PropTypes.func
};

ErrorPage.defaultProps = {
  description: 'Oh snap, something went wrong, please try reloading',
  onRetry: () => window.location.reload()
};

export default ErrorPage;
