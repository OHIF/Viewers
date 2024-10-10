import React, { ReactNode, useEffect, useRef, useState } from 'react';
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
import { getData } from '../../../../../indexedDB';
import DialogBox from './DialogBox';

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  showPatientInfo = PatientInfoVisibility.DISABLED,
  servicesManager,
  Secondary,
  appConfig,
  ...props
}: withAppTypes): ReactNode {
  const { t } = useTranslation('Header');
  useEffect(() => {
    localStorage.setItem('items', '');
    window.dispatchEvent(new Event('itemsData'));
  }, []);

  // TODO: this should be passed in as a prop instead and the react-router-dom
  // dependency should be dropped
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };
  const [storedValue, setStoredValue] = useState<any>();
  const intervalRef = useRef(null);
  useEffect(() => {
    const checkLocalStorage = async () => {
      const storedValue = await getData('response');
      const modelType = localStorage.getItem('items');
      setStoredValue(storedValue);

      if (storedValue && modelType?.length) {
        setToastMessage('AI predictions have been displayed');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setTimeout(() => {
          setToastMessage('');
        }, 2000);
      }
    };

    // Set the interval and store the ID in the ref
    intervalRef.current = setInterval(checkLocalStorage, 10000);

    // Cleanup function to clear the interval if the component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [promptOpen, setPromptOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState('');
  const options = [
    { id: 0, label: 'Focalnet Dino' },
    // { id: 1, label: 'Multiview' },
    // { id: 2, label: 'Dense Mass' },
    // { id: 3, label: 'Small Mass' },
    // { id: 4, label: 'Clinical History' },
    // { id: 5, label: 'Run all models' }
  ];
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleSelect = item => {
    setSelectedItem(item);
    if (item === 'Clinical History') {
      h;
      setPromptOpen(true);
    }
    setToastMessage('Please wait...');
    setTimeout(() => {
      setToastMessage('');
    }, 2000);
    config;
    localStorage.setItem('items', item);
    window.dispatchEvent(new Event('itemsData'));
    setDropdownOpen(false);
  };

  const clearSelection = () => {
    setSelectedItem('');
    localStorage.setItem('items', '');
    window.dispatchEvent(new Event('itemsData'));
    setDropdownOpen(false);
  };

  return (
    <NavBar
      isSticky={isSticky}
      {...props}
    >
      <div className="relative h-[48px] items-center">
        <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center">
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
                className="w-8 text-white"
              />
            )}
            <div className="ml-1 text-sm text-white">
              Breast Cancer Detection by IITD/AIIMS
              {/* {WhiteLabeling?.createLogoComponentFn?.(React, props) || <Svg name="logo-ohif" />} */}
            </div>
          </div>
        </div>
        {/* <div className="absolute top-1/2 left-[211px]  h-8 w-20 -translate-y-1/2">{future left component}</div> */}
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform">
          <div className="flex items-center justify-center space-x-2">{children}</div>
          {children && (
            <div className="relative min-w-[120px] text-left">
              <div>
                <button
                  type="button"
                  className="hover:bg-white-50 mt-[10px] flex w-full min-w-[120px] items-center justify-center whitespace-nowrap rounded-md bg-[#1E5128] text-sm font-semibold text-white shadow-sm"
                  id="menu-button"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  onClick={toggleDropdown}
                />
              </div>
            </div>
          )}
        </div>
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 select-none items-center">
          {(showPatientInfo === PatientInfoVisibility.VISIBLE ||
            showPatientInfo === PatientInfoVisibility.VISIBLE_COLLAPSED) && (
            <HeaderPatientInfo
              servicesManager={servicesManager}
              appConfig={appConfig}
            />
          )}
          <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
          <div className="flex-shrink-0">
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
                className="h-full w-full text-white hover:bg-[#1E5128]"
              >
                <Icon name="icon-settings" />
              </IconButton>
            </Dropdown>
          </div>
        </div>
      </div>
      <div
        className={`fixed top-4 right-4 z-50 rounded bg-gray-800 px-4 py-2 text-white shadow-lg transition-opacity ${toastMessage ? `opacity-100` : `opacity-0`}`}
      >
        {toastMessage}
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

export default Header;
//local storage -> cutom hook
