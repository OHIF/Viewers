import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, IconPresentationProvider, Icons, ToolButton } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Toolbar, usePatientInfo } from '@ohif/extension-default';
import { preserveQueryParameters } from '@ohif/app';

import { DentalPreferences } from '../preferences/dentalPreferences';
import DentalMeasurementsPalette from '../measurements/DentalMeasurementsPalette';
import { DentalMeasurementPresetId } from '../measurements/dentalMeasurementPresets';
import { ToothNumberingSystem } from '../tooth/toothIdentity';
import { DentalViewerStateStatus } from '../viewerState/useDentalViewerState';
import { formatHeaderValue, getPracticeName } from './practiceHeaderUtils';
import ToothSelector from './ToothSelector';

const HEADER_CLASS_BY_THEME = {
  dental: 'relative h-[56px] w-full border-b border-[#24a78d] bg-[#10201c] px-3',
  standard: 'bg-background border-muted relative h-[56px] w-full border-b px-3',
};

const PRACTICE_NAME_CLASS_BY_THEME = {
  dental: 'truncate text-sm font-semibold text-[#bff4e7]',
  standard: 'text-primary truncate text-sm font-semibold',
};

const MODE_LABEL_CLASS_BY_THEME = {
  dental: 'text-[11px] text-[#76d6c1]',
  standard: 'text-muted-foreground text-[11px]',
};

function getStateStatusText(
  stateStatus: DentalViewerStateStatus,
  stateMessage: string | null
): string | null {
  if (stateStatus === 'loading') {
    return 'Loading';
  }

  if (stateStatus === 'locked') {
    return 'Locked';
  }

  if (stateStatus === 'unsaved') {
    return stateMessage || 'Not saved';
  }

  return null;
}

type PracticeHeaderProps = withAppTypes<{
  appConfig: AppTypes.Config;
  preferences: DentalPreferences;
  stateStatus: DentalViewerStateStatus;
  stateMessage: string | null;
  onSelectedToothChange: (toothId: string) => void;
  onNumberingSystemChange: (numberingSystem: ToothNumberingSystem) => void;
  onThemeToggle: () => void;
  onSelectMeasurementPreset: (presetId: DentalMeasurementPresetId, note: string) => void;
}>;

function PracticeHeader({
  appConfig,
  preferences,
  stateStatus,
  stateMessage,
  onSelectedToothChange,
  onNumberingSystemChange,
  onThemeToggle,
  onSelectMeasurementPreset,
}: PracticeHeaderProps) {
  const { servicesManager, extensionManager, commandsManager } = useSystem();
  const { patientInfo } = usePatientInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const practiceName = getPracticeName(appConfig);
  const isDentalTheme = preferences.theme === 'dental';
  const stateStatusText = useMemo(
    () => getStateStatusText(stateStatus, stateMessage),
    [stateMessage, stateStatus]
  );

  const studySummary = useMemo(() => {
    const displaySets = servicesManager.services.displaySetService.getActiveDisplaySets();
    const displaySet = displaySets?.[0];
    const instance = displaySet?.instances?.[0] || displaySet?.instance;

    return {
      studyDate: instance?.StudyDate || displaySet?.StudyDate,
      modality: instance?.Modality || displaySet?.Modality,
    };
  }, [servicesManager]);

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

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <header
        className={HEADER_CLASS_BY_THEME[preferences.theme]}
        data-cy="dental-practice-header"
      >
        <div className="absolute left-3 top-1/2 flex min-w-[260px] -translate-y-1/2 items-center gap-2">
          {appConfig.showStudyList ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-primary hover:bg-muted"
              data-cy="return-to-work-list"
              onClick={onClickReturnButton}
            >
              <Icons.ArrowLeft className="h-6 w-6" />
            </Button>
          ) : null}
          <div className="flex min-w-0 flex-col">
            <span className={PRACTICE_NAME_CLASS_BY_THEME[preferences.theme]}>
              {practiceName}
            </span>
            <span className={MODE_LABEL_CLASS_BY_THEME[preferences.theme]}>
              Dental Mode
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="relative flex items-center justify-center gap-[4px]">
            <Toolbar buttonSection="primary" />
            <DentalMeasurementsPalette onSelectPreset={onSelectMeasurementPreset} />
          </div>
        </div>

        <div className="absolute right-3 top-1/2 flex max-w-[calc(50vw-260px)] -translate-y-1/2 select-none items-center justify-end gap-2 overflow-hidden">
          <div
            className="hidden w-[220px] min-w-0 flex-shrink flex-col text-right lg:flex"
            data-cy="dental-patient-summary"
          >
            <span className="text-foreground truncate text-[13px] font-semibold">
              {formatHeaderValue(patientInfo.PatientName, 'Patient')}
            </span>
            <span className="text-muted-foreground truncate text-[11px]">
              {formatHeaderValue(patientInfo.PatientID, 'No ID')} |{' '}
              {formatHeaderValue(studySummary.modality, 'No modality')} |{' '}
              {formatHeaderValue(studySummary.studyDate, 'No study date')}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            {stateStatusText ? (
              <span
                className="border-muted text-muted-foreground hidden h-7 max-w-[96px] items-center truncate rounded border px-2 text-[11px] xl:flex"
                data-cy="dental-viewer-state-status"
                title={stateStatusText}
              >
                {stateStatusText}
              </span>
            ) : null}

            <ToothSelector
              preferences={preferences}
              onSelectedToothChange={onSelectedToothChange}
              onNumberingSystemChange={onNumberingSystemChange}
            />
          </div>

          <Button
            variant={isDentalTheme ? 'default' : 'ghost'}
            className="h-9 px-2 text-xs"
            data-cy="dental-theme-toggle"
            onClick={onThemeToggle}
          >
            {isDentalTheme ? 'Dental' : 'Theme'}
          </Button>

          <div className="text-primary flex cursor-pointer items-center">
            <Button
              variant="ghost"
              className="hover:bg-muted"
              data-cy="undo-btn"
              onClick={() => commandsManager.run('undo')}
            >
              <Icons.Undo />
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-muted"
              data-cy="redo-btn"
              onClick={() => commandsManager.run('redo')}
            >
              <Icons.Redo />
            </Button>
          </div>

          <div className="border-muted mx-1.5 h-[25px] border-r" />

          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-muted"
            data-cy="dental-header-settings"
          >
            <Icons.GearSettings />
          </Button>
        </div>
      </header>
    </IconPresentationProvider>
  );
}

export default PracticeHeader;
