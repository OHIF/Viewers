import { Icon } from './../../elements/Icon';
import React from 'react';

function StudyListLoadingText() {
  return (
    <div className="loading-text">
      Loading... <Icon name="circle-notch" animation="pulse" />
    </div>
  );
}

export { StudyListLoadingText };
