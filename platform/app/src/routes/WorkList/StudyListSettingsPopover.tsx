import React from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { useTranslation, type TFunction } from 'react-i18next';

import { useAppConfig } from '@state';
import { useSystem } from '@ohif/core';
import { StudyList, Icons, Button, useModal } from '@ohif/ui-next';

export type SettingsMenuItem = {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
};

type DefaultItemsContext = {
  t: TFunction;
  navigate: NavigateFunction;
  customizationService: any;
  show: ReturnType<typeof useModal>['show'];
  appConfig: ReturnType<typeof useAppConfig>[0];
};

export function defaultSettingsMenuItems({
  t,
  navigate,
  customizationService,
  show,
  appConfig,
}: DefaultItemsContext): SettingsMenuItem[] {
  const items: SettingsMenuItem[] = [
    {
      id: 'about',
      label: 'About OHIF Viewer',
      onClick: () => {
        const AboutModal = customizationService.getCustomization('ohif.aboutModal');
        show({
          content: AboutModal,
          title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
          containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
        });
      },
    },
    {
      id: 'appearance',
      label: 'Appearance',
      onClick: () => {
        const AppearanceModal = customizationService.getCustomization('ohif.appearanceModal');
        show({
          content: AppearanceModal,
          title: AppearanceModal?.title ?? t('AppearanceModal:Appearance'),
          containerClassName: AppearanceModal?.containerClassName ?? 'max-w-md',
        });
      },
    },
    {
      id: 'userPreferences',
      label: 'User Preferences',
      onClick: () => {
        const UserPreferencesModal = customizationService.getCustomization(
          'ohif.userPreferencesModal'
        );
        show({
          content: UserPreferencesModal,
          title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
        });
      },
    },
  ];

  if (appConfig.oidc) {
    items.push({
      id: 'logout',
      label: t('Header:Logout'),
      onClick: () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }

  return items;
}

export function StudyListSettingsPopover() {
  // SettingsPopover.Workflow now uses useStudyListWorkflows internally
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services as any;
  const { show } = useModal();

  const defaults = defaultSettingsMenuItems({
    t,
    navigate,
    customizationService,
    show,
    appConfig,
  });
  const buildItems = customizationService.getCustomization('workList.settingsMenuItems');
  const items: SettingsMenuItem[] =
    typeof buildItems === 'function'
      ? (() => {
          const result = (
            buildItems as (defaults: SettingsMenuItem[]) => SettingsMenuItem[]
          )(defaults);
          return Array.isArray(result) ? result : defaults;
        })()
      : defaults;

  return (
    <StudyList.SettingsPopover>
      <StudyList.SettingsPopover.Trigger>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open settings"
        >
          <Icons.SettingsStudyList
            aria-hidden="true"
            className="h-4 w-4"
          />
        </Button>
      </StudyList.SettingsPopover.Trigger>
      <StudyList.SettingsPopover.Content>
        <StudyList.SettingsPopover.Workflow />
        <StudyList.SettingsPopover.Divider />
        {items.map(item => (
          <StudyList.SettingsPopover.Item
            key={item.id}
            onClick={item.onClick}
          >
            {item.label}
          </StudyList.SettingsPopover.Item>
        ))}
      </StudyList.SettingsPopover.Content>
    </StudyList.SettingsPopover>
  );
}
