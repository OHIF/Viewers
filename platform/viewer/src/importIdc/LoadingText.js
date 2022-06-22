import React from 'react';
import { withTranslation } from '../../../ui/src/contextProviders';
import { Icon } from '../../../ui/src/elements/Icon';

function LoadingText({ t: translate }) {
  return (
    <div className="loading-text ">
      {translate('Loading')}...{' '}
      <Icon
        name="circle-notch"
        className="loading-icon-spin"
        animation="pulse"
      />
    </div>
  );
}

const connectedComponent = withTranslation('LoadingText')(LoadingText);

export { connectedComponent as LoadingText };
