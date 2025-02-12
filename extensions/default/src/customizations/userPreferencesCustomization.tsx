import React, { useState } from 'react';
import { useSystem, hotkeys as hotkeysModule } from '@ohif/core';
import { UserPreferencesModal } from '@ohif/ui-next';
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
      <div>
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              className="text-primary-600 hover:text-primary-500"
              onClick={onResetHandler}
            >
              {t('Reset to defaults')}
            </button>
            <div className="flex space-x-2">
              <button
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => {
                  hotkeysModule.stopRecord();
                  hotkeysModule.unpause();
                  hide();
                }}
              >
                {t('Cancel')}
              </button>
              <button
                className="bg-primary-600 hover:bg-primary-500 focus-visible:outline-primary-600 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => {
                  if (state.languageValue !== currentLanguage.value) {
                    i18n.changeLanguage(state.languageValue);
                  }
                  hotkeysManager.setHotkeys(hotkeyDefinitions);
                  hide();
                }}
              >
                {t('Save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserPreferencesModal>
  );
}

export default {
  'ohif.userPreferencesModal': UserPreferencesModalDefault,
};
