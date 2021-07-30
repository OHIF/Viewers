import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { IconButton, Icon, NavBar } from '../../../components';

import OHIFLogo from './OHIFLogo.js';

function Header({ appLogo = OHIFLogo(), children, t }) {
  const showSettingsDropdown = () => {
    // TODO: Update once dropdown component is created
  };

  return (
    <NavBar className={px('justify-between')} isSticky>
      <div className={px('flex items-center')}>
        <div className={px('mx-3')}>{appLogo}</div>
        <div>{children}</div>
      </div>
      <div className={px('flex items-center')}>
        <span className={px('mr-3 text-common-light text-lg')}>
          {t('FOR INVESTIGATIONAL USE ONLY')}
        </span>
        <IconButton
          variant="text"
          color="inherit"
          className={px('text-primary-active')}
          onClick={showSettingsDropdown}
        >
          <React.Fragment>
            <Icon name="settings" />
            <Icon name="chevron-down" />
          </React.Fragment>
        </IconButton>
      </div>
    </NavBar>
  );
}

Header.propTypes = {
  appLogo: PropTypes.node,
  children: PropTypes.node,
  t: PropTypes.func.isRequired,
};

export default withTranslation(['Header'])(Header);
