import React, { useState } from 'react';
import { useSystem, hotkeys as hotkeysModule } from '@ohif/core';
import { UserPreferencesModal, FooterAction } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import i18n from '@ohif/i18n';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ohif/ui-next';

const { availableLanguages, defaultLanguage, currentLanguage: currentLanguageFn } = i18n;

function UserPreferencesModalDefault({ hide }) {
  const { hotkeysManager } = useSystem();
  const { t } = useTranslation('UserPreferencesModal');

  const { hotkeyDefinitions = {}, hotkeyDefaults = {} } = hotkeysManager;

  const currentLanguage = currentLanguageFn();

  const [state, setState] = useState({
    hotkeyDefinitions,
    languageValue: currentLanguage.value,
  });

  const onLanguageChangeHandler = value => {
    setState(state => ({ ...state, languageValue: value }));
  };

  const onResetHandler = () => {
    setState(state => ({
      ...state,
      languageValue: defaultLanguage.value,
      hotkeyDefinitions: hotkeyDefaults,
    }));

    hotkeysManager.restoreDefaultBindings();
  };

  return (
    <UserPreferencesModal className="w-[900px]">
      <UserPreferencesModal.Body>
        {/* Language Section */}
        <div className="mb-3 flex items-center space-x-14">
          <UserPreferencesModal.SubHeading>{t('Language')}</UserPreferencesModal.SubHeading>
          <Select
            defaultValue={state.languageValue}
            onValueChange={onLanguageChangeHandler}
          >
            <SelectTrigger
              className="w-60"
              aria-label="Language"
            >
              <SelectValue placeholder={t('Select language')} />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map(lang => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                >
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <UserPreferencesModal.SubHeading>{t('Hotkeys')}</UserPreferencesModal.SubHeading>
        <UserPreferencesModal.HotkeysGrid>
          {Object.entries(hotkeyDefinitions).map(([id, definition]) => (
            <UserPreferencesModal.Hotkey
              key={id}
              label={t(definition.label)}
              placeholder={definition.keys}
            />
          ))}
        </UserPreferencesModal.HotkeysGrid>
      </UserPreferencesModal.Body>
      <FooterAction>
        <FooterAction.Left>
          <FooterAction.Auxiliary onClick={onResetHandler}>
            {t('Reset to defaults')}
          </FooterAction.Auxiliary>
        </FooterAction.Left>
        <FooterAction.Right>
          <FooterAction.Secondary
            onClick={() => {
              hotkeysModule.stopRecord();
              hotkeysModule.unpause();
              hide();
            }}
          >
            {t('Cancel')}
          </FooterAction.Secondary>
          <FooterAction.Primary
            onClick={() => {
              if (state.languageValue !== currentLanguage.value) {
                i18n.changeLanguage(state.languageValue);
              }
              hotkeysManager.setHotkeys(hotkeyDefinitions);
              hide();
            }}
          >
            {t('Save')}
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </UserPreferencesModal>
  );
}

export default {
  'ohif.userPreferencesModal': UserPreferencesModalDefault,
};
