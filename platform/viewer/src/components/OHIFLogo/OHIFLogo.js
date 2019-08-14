import './OHIFLogo.css';

import { Icon } from '@ohif/ui';
import React from 'react';

function OHIFLogo() {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="header-brand"
      href="http://ohif.org"
    >
      <Icon name="ohif-logo" className="header-logo-image" />
      <div className="header-logo-text">Open Health Imaging Foundation</div>
    </a>
  );
}

export default OHIFLogo;
