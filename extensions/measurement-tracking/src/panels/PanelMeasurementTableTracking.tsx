import React, { useEffect, useState, useRef } from 'react';
import { showLabelAnnotationPopup, PanelMeasurementTable } from '@ohif/extension-default';
import { StudySummary, useViewportGrid, ActionButtons } from '@ohif/ui';
import { Button, Icons } from '@ohif/ui-next';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useAppConfig } from '@state';
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
  const { measurementService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [displayStudySummary, setDisplayStudySummary] = useState(
    DISPLAY_STUDY_SUMMARY_INITIAL_VALUE
  );
  const [appConfig] = useAppConfig();

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

  return (
    <>
      {displayStudySummary.key && (
        <StudySummary
          date={formatDate(displayStudySummary.date)}
          modality={displayStudySummary.modality}
          description={displayStudySummary.description}
        />
      )}
      <PanelMeasurementTable
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        commandsManager={commandsManager}
        measurementFilter={measurement =>
          trackedStudy === measurement.referenceStudyUID &&
          trackedSeries.includes(measurement.referenceSeriesUID)
        }
        customHeader={({ additionalFindings, displayMeasurementsWithoutFindings }) => {
          const disabled =
            additionalFindings.length === 0 && displayMeasurementsWithoutFindings.length === 0;

          if (appConfig?.disableEditing || disabled) {
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
                  <Icons.Download />
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
                  Create DICOM SR
                </Button>
              </div>
            </div>
          );
        }}
      ></PanelMeasurementTable>
    </>
  );
}

export default PanelMeasurementTableTracking;
