import React from 'react';
import PropTypes from 'prop-types';
// TODO: This may fail if package is split from PWA build
import { useHistory } from 'react-router-dom';
//
import { NavBar, Svg, Icon, IconButton, Dropdown, useModal } from '@ohif/ui';

function Header({ children }) {
  const history = useHistory();
  const { show } = useModal();

  const showAboutModal = () => {
    const modalComponent = () => <div>About modal</div>;
    show({
      title: 'About',
      content: modalComponent,
    });
  };

  const showPreferencesModal = () => {
    const modalComponent = () => <div>Preferences modal</div>;
    show({
      title: 'Preferences',
      content: modalComponent,
    });
  };

  // const dropdownContent = [
  //   {
  //     name: 'Soft tissue',
  //     value: '400/40',
  //   },
  //   { name: 'Lung', value: '1500 / -600' },
  //   { name: 'Liver', value: '150 / 90' },
  //   { name: 'Bone', value: '2500 / 480' },
  //   { name: 'Brain', value: '80 / 40' },
  // ]

  return (
    <NavBar className="justify-between border-b-4 border-black">
      <div className="flex justify-between flex-1">
        <div className="flex items-center">
          {/* // TODO: Should preserve filter/sort
              // Either injected service? Or context (like react router's `useLocation`?) */}
          <div
            className="inline-flex items-center mr-3"
            onClick={() => history.push('/')}
          >
            <Icon
              name="chevron-left"
              className="w-8 cursor-pointer text-primary-active"
            />
            <div className="ml-4 cursor-pointer">
              <Svg name="logo-ohif" />
            </div>
          </div>
        </div>
        <div className="flex items-center">{children}</div>
        <div className="flex items-center">
          <span className="mr-3 text-lg text-common-light">
            FOR INVESTIGATIONAL USE ONLY
          </span>
          <Dropdown
            titleElement={
              <IconButton
                variant="text"
                color="inherit"
                size="initial"
                className="text-primary-active"
                onClick={() => {}}
              >
                <React.Fragment>
                  <Icon name="settings" /> <Icon name="chevron-down" />
                </React.Fragment>
              </IconButton>
            }
            list={[
              { title: 'About', icon: 'info', onClick: () => showAboutModal() },
              {
                title: 'Preferences',
                icon: 'settings',
                onClick: () => showPreferencesModal(),
              },
            ]}
          />
        </div>
      </div>
    </NavBar>
  );
}

Header.propTypes = {
  children: PropTypes.any.isRequired,
};

export default Header;
