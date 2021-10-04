import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { NavBar, Svg, Icon, IconButton, Dropdown } from '../';

function Header({
  children,
  isReturnEnabled,
  onClickSettingButton,
  onClickReturnButton,
  isSticky,
  WhiteLabeling,
}) {
  const { t } = useTranslation('Header');

  // TODO: this should be passed in as a prop instead and the react-router-dom
  // dependency should be dropped

  const onClickSetting = () => {
    if (onClickSettingButton) {
      onClickSettingButton();
    }
  };

  const CustomLogo = React => {
    return WhiteLabeling.createLogoComponentFn(React);
  };

  return (
    <NavBar
      className="justify-between border-b-4 border-black"
      isSticky={isSticky}
    >
      <div className="flex justify-between flex-1">
        <div className="flex items-center">
          {/* // TODO: Should preserve filter/sort
              // Either injected service? Or context (like react router's `useLocation`?) */}
          {WhiteLabeling ? CustomLogo(React) : <Svg name="logo-ohif" />}
        </div>
        <div className="flex items-center">{children}</div>
        <div className="flex items-center">
          <IconButton
            id={'options-settings-icon'}
            variant="text"
            color="inherit"
            size="initial"
            className="text-primary-active"
            onClick={onClickSetting}
          >
            <Icon name="settings" />
          </IconButton>
        </div>
      </div>
    </NavBar>
  );
}

Header.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  isReturnEnabled: PropTypes.bool,
  isSticky: PropTypes.bool,
  onClickReturnButton: PropTypes.func,
  WhiteLabeling: PropTypes.element,
};

Header.defaultProps = {
  isReturnEnabled: true,
  isSticky: false,
};

export default Header;
