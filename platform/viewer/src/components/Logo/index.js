import React, { useState, useEffect } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';

import OHIFLogo from '../OHIFLogo/OHIFLogo.js';
import './Logo.css';

const Logo = ({ location, useLargeLogo = false, hasLink = false, t }) => (
  <div className={classNames('entry-header', { 'header-big': useLargeLogo })}>
    <div className="header-left-box">
      {location && location.studyLink && (
        <Link to={location.studyLink} className="header-btn header-viewerLink">
          {t('Back to Viewer')}
        </Link>
      )}
      {OHIFLogo()}

      {hasLink && (
        <Link
          className="header-btn header-studyListLinkSection"
          // to={{
          //   pathname: linkPath,
          //   state: { studyLink: location.pathname },
          // }}
        >
          {t(linkText)}
        </Link>
      )}
    </div>
  </div>
);

export default withTranslation(['Header', 'AboutModal'])(withRouter(Logo));
