import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
const dicomSR = require('@ohif/extension-cornerstone-dicom-sr');
const storeSR = require('./storeSR');

export function XNATStudyMeasurementsActions({ items, StudyInstanceUID, measurementFilter, actions }) {
  const { commandsManager, extensionManager, servicesManager } = useSystem();
  const { measurementService, displaySetService } = servicesManager.services;
  const disabled = !items?.length;

  if (disabled) {
    return null;
  }

  const createSR = async () => {
    const dataSource = extensionManager.getActiveDataSource();
    const measurements = measurementService.getMeasurements(measurementFilter);
    const report = await dicomSR.getReport(measurements, {
      displaySetService,
      cid: '1.2.840.10008.6.1.1030', // Default CID for SR
    });
    const { id, SOPInstanceUID } = report;
    const dicom = dicomSR.getDicom(report);

    storeSR(dicom, dataSource, StudyInstanceUID);
  };

  return (
    <div className="bg-background flex h-9 w-full items-center rounded pr-0.5">
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant="ghost"
          className="pl-1.5"
          onClick={() => {
            commandsManager.runCommand('downloadCSVMeasurementsReport', {
              StudyInstanceUID,
              measurementFilter,
            });
          }}
        >
          <Icons.Download className="h-5 w-5" />
          <span className="pl-1">CSV</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={createSR}
        >
          <Icons.Add />
          Create SR
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="pl-0.5"
          onClick={e => {
            e.stopPropagation();
            if (actions?.onDelete) {
              actions.onDelete();
              return;
            }
            commandsManager.runCommand('clearMeasurements', {
              measurementFilter,
            });
          }}
        >
          <Icons.Delete />
          Delete
        </Button>
      </div>
    </div>
  );
}

export default XNATStudyMeasurementsActions; 