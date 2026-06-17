import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Toolbar, usePatientInfo } from '@ohif/extension-default';
import { preserveQueryParameters } from '@ohif/app';

import { formatHeaderValue, getPracticeName } from './practiceHeaderUtils';

function PracticeHeader({ appConfig }: withAppTypes<{ appConfig: AppTypes.Config }>) {
  const { servicesManager, extensionManager, commandsManager } = useSystem();
  const { patientInfo } = usePatientInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const practiceName = getPracticeName(appConfig);

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
    <header
      className="bg-background border-muted flex h-[56px] w-full items-center border-b px-3"
      data-cy="dental-practice-header"
    >
      <div className="flex min-w-[260px] items-center gap-2">
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
          <span className="text-primary truncate text-sm font-semibold">{practiceName}</span>
          <span className="text-muted-foreground text-[11px]">Dental Mode</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        <Toolbar buttonSection="primary" />
      </div>

      <div className="flex min-w-[360px] items-center justify-end gap-3">
        <div
          className="hidden min-w-0 flex-col text-right lg:flex"
          data-cy="dental-patient-summary"
        >
          <span className="text-foreground truncate text-[13px] font-semibold">
            {formatHeaderValue(patientInfo.PatientName, 'Patient')}
          </span>
          <span className="text-muted-foreground truncate text-[11px]">
            {formatHeaderValue(patientInfo.PatientID, 'No ID')} ·{' '}
            {formatHeaderValue(studySummary.modality, 'No modality')} ·{' '}
            {formatHeaderValue(studySummary.studyDate, 'No study date')}
          </span>
        </div>

        <Button
          variant="ghost"
          className="text-primary hover:bg-muted"
          data-cy="dental-tooth-selector-placeholder"
        >
          Tooth
        </Button>

        <div className="text-primary flex items-center">
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
  );
}

export default PracticeHeader;
