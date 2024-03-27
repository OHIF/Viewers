import React, { ReactNode } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import NavBar from '../NavBar';
import Svg from '../Svg';
import Icon from '../Icon';
import IconButton from '../IconButton';
import Dropdown from '../Dropdown';
import HeaderPatientInfo from '../HeaderPatientInfo';
import { PatientInfoVisibility } from '../../types/PatientInfoVisibility';

function Header({
  children,
  menuOptions,
  isReturnEnabled,
  onClickReturnButton,
  isSticky,
  WhiteLabeling,
  showPatientInfo = PatientInfoVisibility.VISIBLE_COLLAPSED,
  servicesManager,
  ...props
}): ReactNode {
  const { t } = useTranslation('Header');

  // TODO: this should be passed in as a prop instead and the react-router-dom
  // dependency should be dropped
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  return (
    <NavBar
      className="justify-between border-b-4 border-black"
      isSticky={isSticky}
    >
      <div className="flex flex-1 justify-between">
        <div className="flex items-center">
          {/* // TODO: Should preserve filter/sort
              // Either injected service? Or context (like react router's `useLocation`?) */}
          <div
            className={classNames(
              'mr-3 inline-flex items-center',
              isReturnEnabled && 'cursor-pointer'
            )}
            onClick={onClickReturn}
            data-cy="return-to-work-list"
          >
            {isReturnEnabled && (
              <Icon
                name="chevron-left"
                className="text-primary-active w-8"
              />
            )}
            <div className="ml-4">
              {WhiteLabeling?.createLogoComponentFn?.(React, props) || <Svg name="logo-ohif" />}
            </div>
          </div>
        </div>
        <div className="flex items-center">{children}</div>
        <div className="flex items-center">
          {(showPatientInfo === PatientInfoVisibility.VISIBLE ||
            showPatientInfo === PatientInfoVisibility.VISIBLE_COLLAPSED) && (
            <HeaderPatientInfo servicesManager={servicesManager} />
          )}
          <div className="bg-primary-dark border-primary-dark mx-1.5 h-[25px] max-w-xs border"></div>
          <Dropdown
            id="options"
            showDropdownIcon={false}
            list={menuOptions}
            alignment="right"
          >
            <IconButton
              id={'options-settings-icon'}
              variant="text"
              color="inherit"
              size="initial"
              className="text-primary-active hover:bg-primary-dark"
            >
              <Icon name="icon-settings" />
            </IconButton>
          </Dropdown>
        </div>
      </div>
    </NavBar>
  );
}

Header.propTypes = {
  menuOptions: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
    })
  ),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  isReturnEnabled: PropTypes.bool,
  isSticky: PropTypes.bool,
  onClickReturnButton: PropTypes.func,
  WhiteLabeling: PropTypes.object,
  showPatientInfo: PropTypes.string,
  servicesManager: PropTypes.object,
};

Header.defaultProps = {
  isReturnEnabled: true,
  isSticky: false,
};

export default Header;
