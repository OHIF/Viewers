import React, { useEffect, useState } from 'react';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui-next';
import { Button, Icons } from '@ohif/ui-next';
import { PanelMeasurement, StudySummaryFromMetadata } from '@ohif/extension-cornerstone';
import { useTrackedMeasurements } from '../getContextModule';
import { useTranslation } from 'react-i18next';

const { filterAny, filterNone, filterNot, filterTracked } = utils.MeasurementFilters;

function PanelMeasurementTableTracking({
  servicesManager,
  extensionManager,
  commandsManager,
}: withAppTypes) {
  const [viewportGrid] = useViewportGrid();
  const { t } = useTranslation('MeasurementTable');
  const { customizationService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const initialTrackedFilter = trackedStudy
    ? filterTracked(trackedStudy, trackedSeries)
    : filterAny;
  const [measurementFilters, setMeasurementFilters] = useState({
    measurementFilter: initialTrackedFilter,
    untrackedFilter: filterNot('measurementFilter'),
    unmappedFilter: filterAny,
  });

  useEffect(() => {
    let updatedMeasurementFilters = { ...measurementFilters };
    if (trackedMeasurements.matches('tracking') && trackedStudy) {
      updatedMeasurementFilters.measurementFilter = filterTracked(trackedStudy, trackedSeries);
    } else {
      updatedMeasurementFilters.measurementFilter = filterAny;
    }
    setMeasurementFilters(updatedMeasurementFilters);
  }, [trackedMeasurements, trackedStudy, trackedSeries]);

  const { disableEditing } = customizationService.getCustomization(
    'PanelMeasurement.disableEditing',
    {
      id: 'default.disableEditing',
      disableEditing: false,
    }
  );

  return (
    <>
      <StudySummaryFromMetadata studyInstanceUID={trackedStudy} />
      <PanelMeasurement
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        commandsManager={commandsManager}
        measurementFilters={measurementFilters}
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
                    commandsManager.runCommand('clearMeasurements', measurementFilters);
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
                    commandsManager.runCommand('clearMeasurements', measurementFilters);
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
