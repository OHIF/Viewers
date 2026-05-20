import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@state';
import { useSystem } from '@ohif/core';
import { StudyList, Icons, Button, useModal } from '@ohif/ui-next';

export function StudyListSettingsPopover() {
  // SettingsPopover.Workflow now uses useStudyListWorkflows internally
  const { t } = useTranslation();
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services as any;
  const { show } = useModal();

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
        <StudyList.SettingsPopover.Item
          onClick={() => {
            const AboutModal = customizationService.getCustomization('ohif.aboutModal');
            show({
              content: AboutModal,
              title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
              containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
            });
          }}
        >
          About OHIF Viewer
        </StudyList.SettingsPopover.Item>
        <StudyList.SettingsPopover.Item
          onClick={() => {
            const UserPreferencesModal = customizationService.getCustomization(
              'ohif.userPreferencesModal'
            );
            show({
              content: UserPreferencesModal,
              title: UserPreferencesModal?.title ?? t('UserPreferencesModal:User preferences'),
              containerClassName:
                UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
            });
          }}
        >
          User Preferences
        </StudyList.SettingsPopover.Item>
        {appConfig.oidc && (
          <StudyList.SettingsPopover.Item
            onClick={() => {
              navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
            }}
          >
            {t('Header:Logout')}
          </StudyList.SettingsPopover.Item>
        )}
      </StudyList.SettingsPopover.Content>
    </StudyList.SettingsPopover>
  );
}
