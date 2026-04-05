import React, { useMemo, useState, useEffect } from 'react';
import { useSystem, hotkeys as hotkeysModule, utils } from '@ohif/core';
import { UserPreferencesModal, FooterAction } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import i18n from '@ohif/i18n';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ohif/ui-next';

const { availableLanguages, defaultLanguage, currentLanguage: currentLanguageFn } = i18n;

interface HotkeyDefinition {
  keys: string;
  label: string;
}

interface HotkeyDefinitions {
  [key: string]: HotkeyDefinition;
}

type MouseModifierKey = 'ctrl' | 'shift' | 'alt' | 'meta';
type MouseModifierAssignments = Partial<Record<MouseModifierKey, string>>;

interface MouseModifierActionDefinition {
  id: string;
  label: string;
  defaultModifier?: MouseModifierKey;
  onChange?: (modifierKey?: MouseModifierKey) => void;
}

const NONE_MOUSE_MODIFIER_ACTION = '__none__';
const mouseModifierKeys: MouseModifierKey[] = ['ctrl', 'shift', 'alt', 'meta'];

function UserPreferencesModalDefault({ hide }: { hide: () => void }) {
  const { hotkeysManager, mouseBindingsManager, servicesManager } = useSystem();
  const { t, i18n: i18nextInstance } = useTranslation('UserPreferencesModal');
  const { customizationService, toolbarService, viewportGridService } = servicesManager.services;
  const rawMouseModifierActions =
    (mouseBindingsManager.getActionDefinitions() as MouseModifierActionDefinition[]) || [];
  const rawMouseShortcuts =
    customizationService.getCustomization('ohif.hotkeyBindings.mouseShortcuts') || [];
  const initialMouseShortcuts = rawMouseShortcuts.map(shortcut => ({
    ...shortcut,
    keys: typeof shortcut.keys === 'function' ? shortcut.keys() : shortcut.keys,
    defaultKeys:
      typeof shortcut.defaultKeys === 'function' ? shortcut.defaultKeys() : shortcut.defaultKeys,
  }));
  const initialMouseModifierAssignments = mouseBindingsManager.getBindings();

  const { hotkeyDefinitions = {}, hotkeyDefaults = {} } = hotkeysManager;

  const fallbackHotkeyDefinitions = useMemo(
    () =>
      hotkeysManager.getValidHotkeyDefinitions(
        hotkeysModule.defaults.hotkeyBindings
      ) as HotkeyDefinitions,
    [hotkeysManager]
  );

  useEffect(() => {
    if (!Object.keys(hotkeyDefaults).length) {
      hotkeysManager.setDefaultHotKeys(hotkeysModule.defaults.hotkeyBindings);
    }

    if (!Object.keys(hotkeyDefinitions).length) {
      hotkeysManager.setHotkeys(fallbackHotkeyDefinitions);
    }
  }, [hotkeysManager, hotkeyDefaults, hotkeyDefinitions, fallbackHotkeyDefinitions]);

  const resolvedHotkeyDefaults = Object.keys(hotkeyDefaults).length
    ? (hotkeyDefaults as HotkeyDefinitions)
    : fallbackHotkeyDefinitions;

  const initialHotkeyDefinitions = Object.keys(hotkeyDefinitions).length
    ? (hotkeyDefinitions as HotkeyDefinitions)
    : resolvedHotkeyDefaults;

  const currentLanguage = currentLanguageFn();

  const [state, setState] = useState({
    hotkeyDefinitions: initialHotkeyDefinitions,
    languageValue: currentLanguage.value,
    mouseModifierActions: rawMouseModifierActions,
    mouseModifierAssignments: initialMouseModifierAssignments,
    mouseShortcuts: initialMouseShortcuts,
  });

  const onLanguageChangeHandler = (value: string) => {
    setState(state => ({ ...state, languageValue: value }));
  };

  const onHotkeyChangeHandler = (id: string, newKeys: string) => {
    setState(state => ({
      ...state,
      hotkeyDefinitions: {
        ...state.hotkeyDefinitions,
        [id]: {
          ...state.hotkeyDefinitions[id],
          keys: newKeys,
        },
      },
    }));
  };

  const onMouseShortcutChangeHandler = (index: number, newKeys: string) => {
    setState(prev => ({
      ...prev,
      mouseShortcuts: prev.mouseShortcuts.map((shortcut, i) =>
        i === index ? { ...shortcut, keys: newKeys } : shortcut
      ),
    }));
  };

  const onMouseModifierActionChangeHandler = (
    modifierKey: MouseModifierKey,
    nextActionId?: string
  ) => {
    setState(prev => {
      const nextAssignments = { ...prev.mouseModifierAssignments } as MouseModifierAssignments;

      if (!nextActionId) {
        delete nextAssignments[modifierKey];
      } else {
        mouseModifierKeys.forEach(existingModifierKey => {
          if (nextAssignments[existingModifierKey] === nextActionId) {
            delete nextAssignments[existingModifierKey];
          }
        });

        nextAssignments[modifierKey] = nextActionId;
      }

      return {
        ...prev,
        mouseModifierAssignments: nextAssignments,
      };
    });
  };

  const onResetHandler = () => {
    setState(state => ({
      ...state,
      languageValue: defaultLanguage.value,
      hotkeyDefinitions: resolvedHotkeyDefaults,
      mouseModifierAssignments: mouseBindingsManager.getDefaultBindings(),
      mouseShortcuts: initialMouseShortcuts.map(shortcut => ({
        ...shortcut,
        keys: shortcut.defaultKeys ?? shortcut.keys,
      })),
    }));

    hotkeysManager.restoreDefaultBindings();
  };

  const displayNames = React.useMemo(() => {
    if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
      return null;
    }

    const locales = [state.languageValue, currentLanguage.value, i18nextInstance.language, 'en'];
    const uniqueLocales = Array.from(new Set(locales.filter(Boolean)));

    try {
      return new Intl.DisplayNames(uniqueLocales, { type: 'language', fallback: 'none' });
    } catch (error) {
      console.warn('Intl.DisplayNames not supported for locales', uniqueLocales, error);
    }

    return null;
  }, [state.languageValue, currentLanguage.value, i18nextInstance.language]);

  const getLanguageLabel = React.useCallback(
    (languageValue: string, fallbackLabel: string) => {
      const translationKey = `LanguageName.${languageValue}`;
      if (i18nextInstance.exists(translationKey, { ns: 'UserPreferencesModal' })) {
        return t(translationKey);
      }

      if (displayNames) {
        try {
          const localized = displayNames.of(languageValue);
          if (localized && localized.toLowerCase() !== languageValue.toLowerCase()) {
            return localized.charAt(0).toUpperCase() + localized.slice(1);
          }
        } catch (error) {
          console.debug(`Unable to resolve display name for ${languageValue}`, error);
        }
      }

      return fallbackLabel;
    },
    [displayNames, i18nextInstance, t]
  );

  const getModifierLabel = React.useCallback(
    (modifierKey: MouseModifierKey) => {
      const keyCode = utils.ModifierKeyNameToCode[modifierKey];
      const fallbackLabel = (keyCode && utils.ModifierKeyCodeToName[keyCode]) || modifierKey;

      return t(`HotkeyKeys.${modifierKey}`, { defaultValue: fallbackLabel });
    },
    [t]
  );

  return (
    <UserPreferencesModal>
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
                  {getLanguageLabel(lang.value, lang.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.mouseModifierActions.length > 0 && (
          <>
            <UserPreferencesModal.SubHeading>
              {t('Mouse Modifiers')}
            </UserPreferencesModal.SubHeading>
            <div className="overflow-x-auto">
              <div className="grid min-w-[44rem] grid-cols-4 gap-3">
                {mouseModifierKeys.map(modifierKey => (
                  <div
                    key={modifierKey}
                    className="space-y-2"
                  >
                    <span className="text-foreground block text-sm font-medium">
                      {getModifierLabel(modifierKey)}
                    </span>
                    <Select
                      value={
                        state.mouseModifierAssignments[modifierKey] ?? NONE_MOUSE_MODIFIER_ACTION
                      }
                      onValueChange={value =>
                        onMouseModifierActionChangeHandler(
                          modifierKey,
                          value === NONE_MOUSE_MODIFIER_ACTION ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger
                        className="bg-background text-foreground w-full"
                        aria-label={getModifierLabel(modifierKey)}
                      >
                        <SelectValue placeholder={t('No Action', { defaultValue: 'No Action' })} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_MOUSE_MODIFIER_ACTION}>
                          {t('No Action', { defaultValue: 'No Action' })}
                        </SelectItem>
                        {state.mouseModifierActions.map(action => (
                          <SelectItem
                            key={action.id}
                            value={action.id}
                          >
                            {t(action.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {state.mouseShortcuts.length > 0 && (
          <>
            <UserPreferencesModal.SubHeading>
              {t('Mouse Shortcuts')}
            </UserPreferencesModal.SubHeading>
            <UserPreferencesModal.HotkeysGrid>
              {state.mouseShortcuts.map((shortcut, index) => (
                <UserPreferencesModal.MouseShortcut
                  key={index}
                  label={t(shortcut.label)}
                  value={shortcut.keys}
                  onChange={newKeys => onMouseShortcutChangeHandler(index, newKeys)}
                  hotkeys={hotkeysModule}
                />
              ))}
            </UserPreferencesModal.HotkeysGrid>
          </>
        )}

        <UserPreferencesModal.SubHeading>{t('Hotkeys')}</UserPreferencesModal.SubHeading>
        <UserPreferencesModal.HotkeysGrid>
          {Object.entries(state.hotkeyDefinitions).map(([id, definition]) => (
            <UserPreferencesModal.Hotkey
              key={id}
              label={t(definition.label)}
              value={definition.keys}
              onChange={newKeys => onHotkeyChangeHandler(id, newKeys)}
              placeholder={definition.keys}
              hotkeys={hotkeysModule}
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
              hotkeysManager.setHotkeys(state.hotkeyDefinitions);

              const normalizedMouseModifierAssignments =
                mouseBindingsManager.setBindings(state.mouseModifierAssignments);

              mouseBindingsManager.applyBindings(normalizedMouseModifierAssignments);

              for (const shortcut of state.mouseShortcuts) {
                shortcut.onChange?.(shortcut.keys);
              }

              if (state.mouseModifierActions.length > 0 || state.mouseShortcuts.length > 0) {
                const viewportId = viewportGridService.getActiveViewportId();
                toolbarService.refreshToolbarState({ viewportId });
              }

              if (state.languageValue !== currentLanguage.value) {
                i18n.changeLanguage(state.languageValue);
                window.location.reload();
                return;
              }

              hotkeysModule.stopRecord();
              hotkeysModule.unpause();
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
