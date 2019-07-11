import './OHIFLogo.css';
import React from 'react';

function OHIFLogo() {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="header-brand"
      href="http://medi.cs.queensu.ca/"
    >
      <div className="header-logo-text">ProstateCancer.ai</div>
    </a>
  );
}

export default OHIFLogo;
