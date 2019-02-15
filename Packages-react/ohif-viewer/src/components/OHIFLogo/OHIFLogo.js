import React from 'react';
import './OHIFLogo.css';

const Icons = 'icons.svg';

function OHIFLogo() {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="header-brand"
      href="http://ohif.org"
    >
      <svg className="header-logo-image">
        <use xlinkHref={`${Icons}#icon-ohif-logo`} />
      </svg>
      <div className="header-logo-text">Open Health Imaging Foundation</div>
    </a>
  );
}

export default OHIFLogo;
