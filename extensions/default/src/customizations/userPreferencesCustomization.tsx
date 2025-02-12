import React, { useState } from 'react';
import { UserPreferencesDialog } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ohif/ui-next';

interface HotkeyDefinition {
  command: string;
  keys: string;
}

interface UserPreferencesModalProps {
  availableLanguages?: Array<{ value: string; label: string }>;
  defaultLanguage?: string;
  currentLanguage?: string;
  disabled?: boolean;
  hotkeyDefinitions?: Record<string, HotkeyDefinition>;
  hotkeyDefaults?: Record<string, HotkeyDefinition>;
  onCancel?: () => void;
  onSubmit?: (state: {
    isDisabled: boolean;
    hotkeyErrors: Record<string, string>;
    hotkeyDefinitions: Record<string, HotkeyDefinition>;
    language: string;
  }) => void;
  onReset?: () => void;
  hotkeysModule?: {
    initialize: () => void;
    pause: () => void;
    unpause: () => void;
    startRecording: () => void;
    record: () => void;
  };
}

function UserPreferencesModal({
  availableLanguages = [{ value: 'en-US', label: 'English' }],
  defaultLanguage = 'en-US',
  currentLanguage = 'en-US',
  disabled = false,
  hotkeyDefinitions = {},
  hotkeyDefaults = {},
  onCancel = () => {},
  onSubmit = () => {},
  onReset = () => {},
  hotkeysModule,
}: UserPreferencesModalProps) {
  const { t } = useTranslation('UserPreferencesModal');
  const [state, setState] = useState({
    isDisabled: disabled,
    hotkeyErrors: {} as Record<string, string>,
    hotkeyDefinitions,
    language: currentLanguage,
  });

  const onLanguageChangeHandler = (value: string) => {
    setState(state => ({ ...state, language: value }));
  };

  const onResetHandler = () => {
    setState(state => ({
      ...state,
      language: defaultLanguage,
      hotkeyDefinitions: hotkeyDefaults,
      hotkeyErrors: {},
      isDisabled: disabled,
    }));
    onReset();
  };

  const onSubmitHandler = () => {
    onSubmit(state);
  };

  return (
    <UserPreferencesDialog>
      <UserPreferencesDialog.Body>
        {/* Language Section */}
        <div className="mb-3 flex items-center space-x-14">
          <UserPreferencesDialog.SubHeading>{t('Language')}</UserPreferencesDialog.SubHeading>
          <Select defaultValue={state.language}>
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
                  onClick={() => onLanguageChangeHandler(lang.value)}
                >
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <UserPreferencesDialog.SubHeading>{t('Hotkeys')}</UserPreferencesDialog.SubHeading>
        <UserPreferencesDialog.HotkeysGrid>
          {Object.entries(hotkeyDefinitions).map(([id, definition]) => (
            <UserPreferencesDialog.Hotkey
              key={id}
              label={t(definition.label)}
              placeholder={definition.keys}
            />
          ))}
        </UserPreferencesDialog.HotkeysGrid>
      </UserPreferencesDialog.Body>
      <div>
        <div className="flex-shrink-0">
          <div className="flex w-full items-center justify-between">
            <button
              className="text-primary-600 hover:text-primary-500"
              onClick={onResetHandler}
              disabled={disabled}
            >
              {t('Reset to defaults')}
            </button>
            <div className="flex space-x-2">
              <button
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={onCancel}
              >
                {t('Cancel')}
              </button>
              <button
                className="bg-primary-600 hover:bg-primary-500 focus-visible:outline-primary-600 rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={onSubmitHandler}
                disabled={state.isDisabled}
              >
                {t('Save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </UserPreferencesDialog>
  );
}

export default {
  'ohif.userPreferencesModal': UserPreferencesModal,
};
