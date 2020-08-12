import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, IconButton, Icon, useModal, AboutModal, UserPreferences } from '@ohif/ui';

const PreferencesDropdown = ({ hotkeysManager }) => {
  const { hotkeyDefinitions, hotkeyDefaults } = hotkeysManager;
  const { show, hide } = useModal();
  const { t } = useTranslation();

  const menuOptions = [
    {
      title: t('Header:About'),
      icon: 'info',
      onClick: () => show({
        content: AboutModal,
        title: 'About OHIF Viewer',
      })
    },
    {
      title: t('Header:Preferences'),
      icon: 'settings',
      onClick: () => show({
        title: t('UserPreferencesModal:User Preferences'),
        content: UserPreferences,
        contentProps: {
          hotkeyDefaults: hotkeysManager.getValidHotkeyDefinitions(hotkeyDefaults),
          hotkeyDefinitions,
          onCancel: hide,
          onSubmit: ({ hotkeyDefinitions }) => {
            hotkeysManager.setHotkeys(hotkeyDefinitions);
            hide();
          },
          onReset: () => hotkeysManager.restoreDefaultBindings()
        }
      })
    },
  ];

  return (
    <Dropdown showDropdownIcon={false} list={menuOptions}>
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
        onClick={() => { }}
      >
        <Icon name="chevron-down" />
      </IconButton>
    </Dropdown>
  );
};

export default PreferencesDropdown;
