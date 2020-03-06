/**
 * THIS FILE LOCATION IS TEMPORARY AND SHOULD NOT BE PLACED HERE
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import classnames from 'classnames';

import { Dropdown, AboutContent, withModal } from '@ohif/ui';
import { UserPreferences } from './../UserPreferences';
import OHIFLogo from './OHIFLogo.js';

// Context
import AppContext from './../../context/AppContext';

function Header({
  children = OHIFLogo(),
  home = true,
  location,
  modal: { show },
  t,
  user,
  userManager,
}) {
  const { appConfig = {} } = AppContext;
  const showStudyList = !appConfig.showStudyList;
  const optionsValue = [
    {
      title: t('About'),
      icon: { name: 'info' },
      onClick: () =>
        show({
          content: AboutContent,
          title: t('OHIF Viewer - About'),
        }),
    },
    {
      title: t('Preferences'),
      icon: {
        name: 'user',
      },
      onClick: () =>
        show({
          content: UserPreferences,
          title: t('User Preferences'),
        }),
    },
  ];

  if (user && userManager) {
    optionsValue.push({
      title: t('Logout'),
      icon: { name: 'power-off' },
      onClick: () => userManager.signoutRedirect(),
    });
  }

  return (
    <React.Fragment>
      <div className={classnames()}>{t('INVESTIGATIONAL USE ONLY')}</div>
      <div className={classnames('entry-header', home ? 'header-big' : '')}>
        <div className={classnames()}>
          {location && location.studyLink && (
            <Link to={location.studyLink} className={classnames()}>
              {t('Back to Viewer')}
            </Link>
          )}

          {children}

          {showStudyList && !home && (
            <Link
              className=""
              to={{
                pathname: '/',
                state: { studyLink: location.pathname },
              }}
            >
              {t('Study list')}
            </Link>
          )}
        </div>

        <div className={classnames()}>
          <span className={classnames()}>{t('INVESTIGATIONAL USE ONLY')}</span>
          <Dropdown title={t('Options')} list={optionsValue} align="right" />
        </div>
      </div>
    </React.Fragment>
  );
}

Header.propTypes = {
  children: PropTypes.node,
  home: PropTypes.bool.isRequired,
  location: PropTypes.object.isRequired,
  modal: PropTypes.object,
  t: PropTypes.func.isRequired,
  user: PropTypes.object,
  userManager: PropTypes.object,
};

export default withTranslation(['Header', 'AboutModal'])(
  withRouter(withModal(Header))
);
