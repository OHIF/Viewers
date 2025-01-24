import React, { useEffect, useState } from 'react';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui-next';
import { Button, Icons } from '@ohif/ui-next';
import { PanelMeasurement, StudySummaryFromMetadata } from '@ohif/extension-cornerstone';
import { useTrackedMeasurements } from '../getContextModule';

const { filterAnd, filterPlanarMeasurement, filterMeasurementsBySeriesUID } =
  utils.MeasurementFilters;

function PanelMeasurementTableTracking({
  servicesManager,
  extensionManager,
  commandsManager,
}: withAppTypes) {
  const [viewportGrid] = useViewportGrid();
  const { customizationService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const measurementFilter = trackedStudy
    ? filterAnd(filterPlanarMeasurement, filterMeasurementsBySeriesUID(trackedSeries))
    : filterPlanarMeasurement;

  const disableEditing = customizationService.getCustomization('panelMeasurement.disableEditing');

  return (
    <>
      <StudySummaryFromMetadata StudyInstanceUID={trackedStudy} />
      <PanelMeasurement
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        commandsManager={commandsManager}
        measurementFilter={measurementFilter}
        customHeader={({ additionalFindings, measurements }) => {
          const disabled = additionalFindings.length === 0 && measurements.length === 0;

          if (disableEditing || disabled) {
            return null;
          }

          return (
            <div className="bg-background flex h-9 w-full items-center rounded pr-0.5">
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="pl-1.5"
                  onClick={() => {
                    commandsManager.runCommand('downloadCSVMeasurementsReport', {
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
                  onClick={() => {
                    sendTrackedMeasurementsEvent('SAVE_REPORT', {
                      viewportId: viewportGrid.activeViewportId,
                      isBackupSave: true,
                    });
                  }}
                >
                  <Icons.Add />
                  Create SR
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="pl-0.5"
                  onClick={() => {
                    commandsManager.runCommand('clearMeasurements', { measurementFilter });
                  }}
                >
                  <Icons.Delete />
                  Delete All
                </Button>
              </div>
            </div>
          );
        }}
      ></PanelMeasurement>
    </>
  );
}

export default PanelMeasurementTableTracking;
