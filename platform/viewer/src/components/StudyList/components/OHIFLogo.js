import { Icon } from '@ohif/ui';
import React from 'react';
import classnames from 'classnames';

function OHIFLogo() {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={classnames()}
      href="http://ohif.org"
    >
      <Icon name="ohif-logo" className={classnames()} />
      <Icon name="ohif-text-logo" className={classnames()} />
    </a>
  );
}

export default OHIFLogo;
