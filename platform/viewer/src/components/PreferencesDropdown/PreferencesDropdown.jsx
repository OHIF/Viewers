import React from 'react';

import { Dropdown, IconButton, Icon, useModal } from '@ohif/ui';

const PreferencesDropdown = () => {
  const { show } = useModal();

  const showAboutModal = () => {
    const modalComponent = () => <div>About modal</div>;
    show({
      content: modalComponent,
      title: 'About',
    });
  };

  const showPreferencesModal = () => {
    const modalComponent = () => <div>Preferences modal</div>;
    show({
      content: modalComponent,
      title: 'Preferences',
    });
  };

  return (
    <Dropdown
      showDropdownIcon={false}
      list={[
        { title: 'About', icon: 'info', onClick: showAboutModal },
        {
          title: 'Preferences',
          icon: 'settings',
          onClick: showPreferencesModal,
        },
      ]}
    >
      <IconButton
        variant="text"
        color="inherit"
        size="initial"
        className="text-primary-active"
      >
        <Icon name="settings" />
      </IconButton>
      <IconButton
        variant="text"
        color="inherit"
        size="initial"
        className="text-primary-active"
        onClick={() => {}}
      >
        <Icon name="chevron-down" />
      </IconButton>
    </Dropdown>
  );
};

export default PreferencesDropdown;
