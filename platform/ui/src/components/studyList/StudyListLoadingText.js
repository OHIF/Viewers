import { Icon } from './../../elements/Icon';
import React from 'react';
import { withTranslation } from '../../utils/LanguageProvider';

function StudyListLoadingText({ t: translate }) {
  return (
    <div className="loading-text">
      {translate('Loading')}... <Icon name="circle-notch" animation="pulse" />
    </div>
  );
}

const connectedComponent = withTranslation('StudyListLoadingText')(
  StudyListLoadingText
);

export { connectedComponent as StudyListLoadingText };
