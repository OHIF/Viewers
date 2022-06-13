import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { NavBar, Svg, Icon, IconButton, Tooltip, Dropdown } from '../';

function Header({
  children,
  onClickSettingButton,
  onClickClipboardButton,
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

  const onClickClipboard = () => {
    if (onClickClipboardButton) {
      onClickClipboardButton();
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
          <Dropdown
            id="dropdown-1"
            showDropdownIcon
            list={[
              { id: 1, title: 'Item 1', onClick: () => console.log('xxx') },
              { id: 2, title: 'Item 2', onClick: () => console.log('yyy') },
            ]}
          >
            <span>dropdown</span>
          </Dropdown>
          <Tooltip
            content={
              <div className="text-center max-w-40">
                Copy Active
                <br />
                Image Link
              </div>
            }
          >
            <IconButton
              id={'options-clipboard-icon'}
              variant="text"
              color="inherit"
              size="initial"
              className="text-primary-active"
              onClick={onClickClipboard}
              style={{ padding: 5 }}
            >
              <Icon name="clipboard" />
            </IconButton>
          </Tooltip>
          <Tooltip content="Settings">
            <IconButton
              id={'options-settings-icon'}
              variant="text"
              color="inherit"
              size="initial"
              className="text-primary-active"
              onClick={onClickSetting}
              style={{ padding: 5 }}
            >
              <Icon name="settings" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </NavBar>
  );
}

Header.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  isSticky: PropTypes.bool,
  onClickSettingButton: PropTypes.func,
  onClickClipboardButton: PropTypes.func,
  WhiteLabeling: PropTypes.object,
};

Header.defaultProps = {
  isSticky: false,
};

export default Header;
