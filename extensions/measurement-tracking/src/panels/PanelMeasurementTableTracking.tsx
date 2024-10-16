import React, { useEffect, useState, useRef } from 'react';
import { useMeasurements, showLabelAnnotationPopup } from '@ohif/extension-default';
import { StudySummary, MeasurementTable, useViewportGrid, ActionButtons } from '@ohif/ui';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useAppConfig } from '@state';
import { useTrackedMeasurements } from '../getContextModule';
import debounce from 'lodash.debounce';
import { useTranslation } from 'react-i18next';

const { downloadCSVReport } = utils;
const { formatDate } = utils;

const DISPLAY_STUDY_SUMMARY_INITIAL_VALUE = {
  key: undefined, //
  date: '', // '07-Sep-2010',
  modality: '', // 'CT',
  description: '', // 'CHEST/ABD/PELVIS W CONTRAST',
};

function PanelMeasurementTableTracking({ servicesManager }: withAppTypes) {
  const [viewportGrid] = useViewportGrid();
  const { t } = useTranslation('MeasurementTable');
  const { measurementService, uiDialogService, customizationService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [displayStudySummary, setDisplayStudySummary] = useState(
    DISPLAY_STUDY_SUMMARY_INITIAL_VALUE
  );
  const measurementsPanelRef = useRef(null);
  const [appConfig] = useAppConfig();

  const displayMeasurements = useMeasurements(servicesManager, {
    measurementFilter: measurement =>
      trackedStudy === measurement.referenceStudyUID &&
      trackedSeries.includes(measurement.referenceSeriesUID),
  });

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

  useEffect(() => {
    if (displayMeasurements.length > 0) {
      debounce(() => {
        measurementsPanelRef.current.scrollTop = measurementsPanelRef.current.scrollHeight;
      }, 300)();
    }
  }, [displayMeasurements.length]);

  const jumpToImage = ({ uid, isActive }) => {
    measurementService.jumpToMeasurement(viewportGrid.activeViewportId, uid);

    onMeasurementItemClickHandler({ uid, isActive });
  };

  const onMeasurementItemEditHandler = ({ uid, isActive }) => {
    jumpToImage({ uid, isActive });
    const labelConfig = customizationService.get('measurementLabels');
    const measurement = measurementService.getMeasurement(uid);
    showLabelAnnotationPopup(measurement, uiDialogService, labelConfig).then(val => {
      measurementService.update(
        uid,
        {
          ...val,
        },
        true
      );
    });
  };

  // const onMeasurementItemClickHandler = ({ uid, isActive }) => {
  //   if (!isActive) {
  //     const measurements = [...displayMeasurements];
  //     const measurement = measurements.find(m => m.uid === uid);

  //     measurements.forEach(m => (m.isActive = m.uid !== uid ? false : true));
  //     measurement.isActive = true;
  //     setDisplayMeasurements(measurements);
  //   }
  // };

  const displayMeasurementsWithoutFindings = displayMeasurements.filter(
    dm => dm.measurementType !== measurementService.VALUE_TYPES.POINT && dm.referencedImageId
  );
  const additionalFindings = displayMeasurements.filter(
    dm => dm.measurementType === measurementService.VALUE_TYPES.POINT && dm.referencedImageId
  );

  const nonAcquisitionMeasurements = displayMeasurements.filter(dm => dm.referencedImageId == null);

  const disabled =
    additionalFindings.length === 0 &&
    displayMeasurementsWithoutFindings.length === 0 &&
    nonAcquisitionMeasurements.length === 0;

  return (
    <>
      <div
        className="invisible-scrollbar overflow-y-auto overflow-x-hidden"
        ref={measurementsPanelRef}
        data-cy={'trackedMeasurements-panel'}
      >
        {displayStudySummary.key && (
          <StudySummary
            date={formatDate(displayStudySummary.date)}
            modality={displayStudySummary.modality}
            description={displayStudySummary.description}
          />
        )}
        <MeasurementTable
          title="Measurements"
          data={displayMeasurementsWithoutFindings}
          servicesManager={servicesManager}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
        />
        {additionalFindings.length !== 0 && (
          <MeasurementTable
            title="Additional Findings"
            data={additionalFindings}
            servicesManager={servicesManager}
            onClick={jumpToImage}
            onEdit={onMeasurementItemEditHandler}
          />
        )}
        {nonAcquisitionMeasurements.length !== 0 && (
          <MeasurementTable
            title="Non-tracked"
            data={nonAcquisitionMeasurements}
            servicesManager={servicesManager}
            onClick={jumpToImage}
            onEdit={onMeasurementItemEditHandler}
          />
        )}
      </div>
      {!appConfig?.disableEditing && (
        <div className="flex justify-center p-4">
          <ActionButtons
            t={t}
            actions={[
              {
                label: 'Download CSV',
                onClick: () => {
                  const measurements = measurementService.getMeasurements();
                  const trackedMeasurements = measurements.filter(
                    m =>
                      trackedStudy === m.referenceStudyUID &&
                      trackedSeries.includes(m.referenceSeriesUID)
                  );

                  downloadCSVReport(trackedMeasurements);
                },
              },
              {
                label: 'Create Report',
                onClick: () => {
                  sendTrackedMeasurementsEvent('SAVE_REPORT', {
                    viewportId: viewportGrid.activeViewportId,
                    isBackupSave: true,
                  });
                },
              },
            ]}
            disabled={disabled}
          />
        </div>
      )}
    </>
  );
}

export default PanelMeasurementTableTracking;
