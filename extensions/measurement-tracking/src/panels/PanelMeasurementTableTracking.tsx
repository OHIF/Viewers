import React, { useEffect, useState } from 'react';
import { PanelMeasurement } from '@ohif/extension-cornerstone';
import { useViewportGrid } from '@ohif/ui';
import { StudySummary } from '@ohif/ui-next';
import { Button, Icons } from '@ohif/ui-next';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useTrackedMeasurements } from '../getContextModule';
import { useTranslation } from 'react-i18next';

const { downloadCSVReport, formatDate } = utils;

const DISPLAY_STUDY_SUMMARY_INITIAL_VALUE = {
  key: undefined, //
  date: '', // '07-Sep-2010',
  modality: '', // 'CT',
  description: '', // 'CHEST/ABD/PELVIS W CONTRAST',
};

function PanelMeasurementTableTracking({
  servicesManager,
  extensionManager,
  commandsManager,
}: withAppTypes) {
  const [viewportGrid] = useViewportGrid();
  const { t } = useTranslation('MeasurementTable');
  const { measurementService, customizationService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [displayStudySummary, setDisplayStudySummary] = useState(
    DISPLAY_STUDY_SUMMARY_INITIAL_VALUE
  );

  useEffect(() => {
    const updateDisplayStudySummary = async () => {
      if (trackedMeasurements.matches('tracking') && trackedStudy) {
        const studyMeta = DicomMetadataStore.getStudy(trackedStudy);
        if (!studyMeta || !studyMeta.series || studyMeta.series.length === 0) {
          console.debug('Study metadata not available');
          return;
        }

        const instanceMeta = studyMeta.series[0].instances[0];
        const { StudyDate, StudyDescription } = instanceMeta;

        const modalities = new Set();
        studyMeta.series.forEach(series => {
          if (trackedSeries.includes(series.SeriesInstanceUID)) {
            modalities.add(series.instances[0].Modality);
          }
        });
        const modality = Array.from(modalities).join('/');

        setDisplayStudySummary(prevSummary => {
          if (prevSummary.key !== trackedStudy) {
            return {
              key: trackedStudy,
              date: StudyDate,
              modality,
              description: StudyDescription,
            };
          }
          return prevSummary;
        });
      } else if (!trackedStudy) {
        setDisplayStudySummary(DISPLAY_STUDY_SUMMARY_INITIAL_VALUE);
      }
    };

    updateDisplayStudySummary();
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
      {displayStudySummary.key && (
        <StudySummary
          date={formatDate(displayStudySummary.date)}
          description={displayStudySummary.description}
        />
      )}
      <PanelMeasurement
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        commandsManager={commandsManager}
        measurementFilter={measurement =>
          trackedStudy === measurement.referenceStudyUID &&
          trackedSeries.includes(measurement.referenceSeriesUID)
        }
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
                    const measurements = measurementService.getMeasurements();
                    const trackedMeasurements = measurements.filter(
                      m =>
                        trackedStudy === m.referenceStudyUID &&
                        trackedSeries.includes(m.referenceSeriesUID)
                    );

                    downloadCSVReport(trackedMeasurements);
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
                    measurementService.clearMeasurements();
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
