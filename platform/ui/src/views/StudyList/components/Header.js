import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { IconButton, Icon, NavBar } from '@ohif/ui';

import OHIFLogo from './OHIFLogo.js';

function Header({ appLogo = OHIFLogo(), children, t }) {
  const showSettingsDropdown = () => {
    // TODO: Update once dropdown component is created
  };

  return (
    <NavBar className="justify-between">
      <div className="flex items-center">
        <div className="mx-3">{appLogo}</div>
        <div>{children}</div>
      </div>
      <div className="flex items-center">
        <span className="mr-3 text-custom-grayLight text-lg">
          {t('FOR INVESTIGATIONAL USE ONLY')}
        </span>
        <IconButton
          variant="text"
          color="inherit"
          className="text-custom-blueBright"
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
