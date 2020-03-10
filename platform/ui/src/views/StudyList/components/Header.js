/**
 * THIS FILE LOCATION IS TEMPORARY AND SHOULD NOT BE PLACED HERE
 */
import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { IconButton } from '@ohif/ui';

import OHIFLogo from './OHIFLogo.js';

function Header({ children = OHIFLogo(), t }) {
  return (
    <div className="bg-custom-navy flex flex-row justify-between p-2 text-white">
      <div className="flex items-center">{children}</div>

      <div className="flex items-center">
        <span className="mr-3 color-custom-grayLight">
          {t('FOR INVESTIGATIONAL USE ONLY')}
        </span>
        <IconButton
          variant="text"
          color="inherit"
          className="color-custom-blueRight"
        >
          <React.Fragment>
            <Icon name="settings" />
            <Icon name="chevron-down" />
          </React.Fragment>
        </IconButton>
      </div>
    </div>
  );
}

Header.propTypes = {
  children: PropTypes.node,
  t: PropTypes.func.isRequired,
};

export default withTranslation(['Header'])(Header);
