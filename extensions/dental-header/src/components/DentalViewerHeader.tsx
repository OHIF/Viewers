import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icons,
  useModal,
} from '@ohif/ui-next';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import PracticeHeader from './PracticeHeader';
import { Toolbar } from '@ohif/extension-default/src/Toolbar/Toolbar';
import { Types } from '@ohif/core';
import clsx from 'clsx';
import { preserveQueryParameters } from '@ohif/app';
import { useSystem } from '@ohif/core';
import { useTranslation } from 'react-i18next';

function DentalViewerHeader({
  appConfig,
  isReturnEnabled,
}: withAppTypes<{ appConfig: AppTypes.Config }>) {
  const { servicesManager, extensionManager, commandsManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const [selectedTooth, setSelectedTooth] = useState<string>('');
  const [isToggled, setIsToggled] = useState<boolean>(true);
  const [numberingSystem, setNumberingSystem] = useState<'FDI' | 'Universal'>('FDI');

  const navigate = useNavigate();
  const location = useLocation();

  const onClickReturnButton = () => {
    const { pathname } = location;
    const dataSourceIdx = pathname.indexOf('/', 1);

    const dataSourceName = pathname.substring(dataSourceIdx + 1);
    const existingDataSource = extensionManager.getDataSources(dataSourceName);

    const searchQuery = new URLSearchParams();
    if (dataSourceIdx !== -1 && existingDataSource) {
      searchQuery.append('datasources', pathname.substring(dataSourceIdx + 1));
    }
    preserveQueryParameters(searchQuery);

    navigate({
      pathname: '/',
      search: decodeURIComponent(searchQuery.toString()),
    });
  };

  const handleSwitchToggle = checked => {
    setIsToggled(checked);
  };

  const { t } = useTranslation();
  const { show } = useModal();

  const AboutModal = customizationService.getCustomization(
    'ohif.aboutModal'
  ) as Types.MenuComponentCustomization;

  const UserPreferencesModal = customizationService.getCustomization(
    'ohif.userPreferencesModal'
  ) as Types.MenuComponentCustomization;

  const menuOptions = [
    {
      title: AboutModal?.menuTitle ?? t('Header:About'),
      icon: 'info',
      onClick: () =>
        show({
          content: AboutModal,
          title: AboutModal?.title ?? t('AboutModal:About OHIF Viewer'),
          containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
        }),
    },
    {
      title: UserPreferencesModal.menuTitle ?? t('Header:Preferences'),
      icon: 'settings',
      onClick: () =>
        show({
          content: UserPreferencesModal,
          title: UserPreferencesModal.title ?? t('UserPreferencesModal:User preferences'),
          containerClassName:
            UserPreferencesModal?.containerClassName ?? 'flex max-w-4xl p-6 flex-col',
        }),
    },
  ];

  if (appConfig.oidc) {
    menuOptions.push({
      title: t('Header:Logout'),
      icon: 'power-off',
      onClick: async () => {
        navigate(`/logout?redirect_uri=${encodeURIComponent(window.location.href)}`);
      },
    });
  }

  const handleToothSelect = (toothNumber: string, system: 'FDI' | 'Universal', selected?: any) => {
    setSelectedTooth(toothNumber);
    setNumberingSystem(system);
  };

  // Mock patient info
  const patientInfo = {
    name: 'John Doe',
    id: 'ui123456',
    dateOfBirth: '1985-06-15',
    gender: 'M',
  };

  return (
    <div className={clsx('dental-theme', { 'dental-dark': isToggled })}>
      {/* Practice Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-4 text-white">
        <PracticeHeader
          practiceName="Dental Practice Pro"
          patientInfo={patientInfo}
          onToothSelect={handleToothSelect}
          selectedTooth={selectedTooth}
          numberingSystem={numberingSystem}
          isReturnEnabled={isReturnEnabled}
          onClickReturnButton={onClickReturnButton}
          WhiteLabeling={appConfig.whiteLabeling}
          toggleSwitch={handleSwitchToggle}
          isToggled={isToggled}
        />
      </div>

      {isReturnEnabled && (
        <>
          {/* Toolbar and Controls */}
          <div className="toolbar-section border-b px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Added Return Button in case user dont know about ohif logo return feature */}
              {appConfig.showStudyList && (
                <button
                  onClick={onClickReturnButton}
                  className="toolbar-button flex items-center space-x-2 transition-colors"
                  data-cy="return-to-work-list"
                >
                  <Icons.ArrowLeft className="h-5 w-5" />
                  <span>Back to Study List</span>
                </button>
              )}

              {/* Primary Toolbar */}
              <div className="flex items-center space-x-4">
                <Toolbar buttonSection="primary" />
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center space-x-4">
                {/* Undo/Redo */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => commandsManager.run('undo')}
                    className="toolbar-button"
                  >
                    <Icons.Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => commandsManager.run('redo')}
                    className="toolbar-button"
                  >
                    <Icons.Redo className="h-4 w-4" />
                  </Button>
                </div>

                <div className="toolbar-divider mx-1.5 h-[25px] border-r"></div>

                {/* Settings Menu */}
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary hover:bg-primary-dark mt-2 h-full w-full"
                      >
                        <Icons.GearSettings />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {menuOptions.map((option, index) => {
                        const IconComponent = option.icon
                          ? Icons[option.icon as keyof typeof Icons]
                          : null;
                        return (
                          <DropdownMenuItem
                            key={index}
                            onSelect={option.onClick}
                            className="flex items-center gap-2 py-2"
                          >
                            {IconComponent && (
                              <span className="flex h-4 w-4 items-center justify-center">
                                <Icons.ByName name={option.icon} />
                              </span>
                            )}
                            <span className="flex-1">{option.title}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Toolbar */}
          {/* <div className="secondary-toolbar border-b px-4 py-2">
            <Toolbar buttonSection="secondary" />
          </div> */}
        </>
      )}
    </div>
  );
}

export default DentalViewerHeader;
