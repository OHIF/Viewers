import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  StudySummary,
  MeasurementTable,
  Dialog,
  Input,
  useViewportGrid,
} from '@ohif/ui';
import { DicomMetadataStore, utils } from '@ohif/core';
import { useDebounce } from '@hooks';
import ActionButtons from './ActionButtons';
import { useTrackedMeasurements } from '../../getContextModule';
import createReportDialogPrompt from '../../_shared/createReportDialogPrompt';
import RESPONSES from '../../_shared/PROMPT_RESPONSES';
import downloadCSVReport from '../../_shared/downloadCSVReport';

const { formatDate } = utils;

const DISPLAY_STUDY_SUMMARY_INITIAL_VALUE = {
  key: undefined, //
  date: undefined, // '07-Sep-2010',
  modality: undefined, // 'CT',
  description: undefined, // 'CHEST/ABD/PELVIS W CONTRAST',
};

function PanelMeasurementTableTracking({ servicesManager, extensionManager }) {
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const [measurementChangeTimestamp, setMeasurementsUpdated] = useState(
    Date.now().toString()
  );
  const debouncedMeasurementChangeTimestamp = useDebounce(
    measurementChangeTimestamp,
    200
  );
  const {
    MeasurementService,
    UIDialogService,
    DisplaySetService,
  } = servicesManager.services;
  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
  ] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [displayStudySummary, setDisplayStudySummary] = useState(
    DISPLAY_STUDY_SUMMARY_INITIAL_VALUE
  );
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  useEffect(() => {
    const measurements = MeasurementService.getMeasurements();
    const filteredMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );

    const mappedMeasurements = filteredMeasurements.map(m =>
      _mapMeasurementToDisplay(
        m,
        MeasurementService.VALUE_TYPES,
        DisplaySetService
      )
    );
    setDisplayMeasurements(mappedMeasurements);
    // eslint-ignore-next-line
  }, [
    MeasurementService,
    trackedStudy,
    trackedSeries,
    debouncedMeasurementChangeTimestamp,
  ]);

  const updateDisplayStudySummary = async () => {
    if (trackedMeasurements.matches('tracking')) {
      const StudyInstanceUID = trackedStudy;
      const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
      const instanceMeta = studyMeta.series[0].instances[0];
      const { StudyDate, StudyDescription } = instanceMeta;

      const modalities = new Set();
      studyMeta.series.forEach(series => {
        if (trackedSeries.includes(series.SeriesInstanceUID)) {
          modalities.add(series.instances[0].Modality);
        }
      });
      const modality = Array.from(modalities).join('/');

      if (displayStudySummary.key !== StudyInstanceUID) {
        setDisplayStudySummary({
          key: StudyInstanceUID,
          date: StudyDate, // TODO: Format: '07-Sep-2010'
          modality,
          description: StudyDescription,
        });
      }
    } else if (trackedStudy === '' || trackedStudy === undefined) {
      setDisplayStudySummary(DISPLAY_STUDY_SUMMARY_INITIAL_VALUE);
    }
  };

  // ~~ DisplayStudySummary
  useEffect(() => {
    updateDisplayStudySummary();
  }, [
    displayStudySummary.key,
    trackedMeasurements,
    trackedStudy,
    updateDisplayStudySummary,
  ]);

  // TODO: Better way to consolidated, debounce, check on change?
  // Are we exposing the right API for measurementService?
  // This watches for ALL MeasurementService changes. It updates a timestamp,
  // which is debounced. After a brief period of inactivity, this triggers
  // a re-render where we grab up-to-date measurements.
  useEffect(() => {
    const added = MeasurementService.EVENTS.MEASUREMENT_ADDED;
    const updated = MeasurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = MeasurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = MeasurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, updated, removed, cleared].forEach(evt => {
      subscriptions.push(
        MeasurementService.subscribe(evt, () => {
          setMeasurementsUpdated(Date.now().toString());
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [MeasurementService, sendTrackedMeasurementsEvent]);

  async function exportReport() {
    const measurements = MeasurementService.getMeasurements();
    const trackedMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );

    downloadCSVReport(
      trackedMeasurements,
      trackedStudy,
      trackedSeries,
      MeasurementService
    );
  }

  const jumpToImage = ({ id, isActive }) => {
    MeasurementService.jumpToMeasurement(viewportGrid.activeViewportIndex, id);

    onMeasurementItemClickHandler({ id, isActive });
  };

  const onMeasurementItemEditHandler = ({ id, isActive }) => {
    const measurement = MeasurementService.getMeasurement(id);
    jumpToImage({ id, isActive });

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          MeasurementService.update(
            id,
            {
              ...measurement,
              ...value,
            },
            true
          );
        }
      }
      UIDialogService.dismiss({ id: 'enter-annotation' });
    };

    UIDialogService.create({
      id: 'enter-annotation',
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: 'Enter your annotation',
        noCloseButton: true,
        value: { label: measurement.label || '' },
        body: ({ value, setValue }) => {
          const onChangeHandler = event => {
            event.persist();
            setValue(value => ({ ...value, label: event.target.value }));
          };

          const onKeyPressHandler = event => {
            if (event.key === 'Enter') {
              onSubmitHandler({ value, action: { id: 'save' } });
            }
          };
          return (
            <div className="p-4 bg-primary-dark">
              <Input
                autoFocus
                className="mt-2 bg-black border-primary-main"
                type="text"
                containerClassName="mr-2"
                value={value.label}
                onChange={onChangeHandler}
                onKeyPress={onKeyPressHandler}
              />
            </div>
          );
        },
        actions: [
          // temp: swap button types until colors are updated
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
      },
    });
  };

  const onMeasurementItemClickHandler = ({ id, isActive }) => {
    if (!isActive) {
      const measurements = [...displayMeasurements];
      const measurement = measurements.find(m => m.id === id);

      measurements.forEach(m => (m.isActive = m.id !== id ? false : true));
      measurement.isActive = true;
      setDisplayMeasurements(measurements);
    }
  };

  const displayMeasurementsWithoutFindings = displayMeasurements.filter(
    dm => dm.measurementType !== MeasurementService.VALUE_TYPES.POINT
  );
  const additionalFindings = displayMeasurements.filter(
    dm => dm.measurementType === MeasurementService.VALUE_TYPES.POINT
  );

  return (
    <>
      <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar"
           data-cy={"trackedMeasurements-panel"}>
        {displayStudySummary.key && (
          <StudySummary
            date={formatDate(displayStudySummary.date)}
            modality={displayStudySummary.modality}
            description={displayStudySummary.description}
          />
        )}
        <MeasurementTable
          title="Measurements"
          amount={displayMeasurementsWithoutFindings.length}
          data={displayMeasurementsWithoutFindings}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
        />
        {additionalFindings.length !== 0 && (
          <MeasurementTable
            title="Additional Findings"
            amount={additionalFindings.length}
            data={additionalFindings}
            onClick={jumpToImage}
            onEdit={onMeasurementItemEditHandler}
          />
        )}
      </div>
      <div className="flex justify-center p-4">
        <ActionButtons
          onExportClick={exportReport}
          onCreateReportClick={() => {
            sendTrackedMeasurementsEvent('SAVE_REPORT', {
              viewportIndex: viewportGrid.activeViewportIndex,
              isBackupSave: true,
            });
          }}
        />
      </div>
    </>
  );
}

PanelMeasurementTableTracking.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      MeasurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

// TODO: This could be a MeasurementService mapper
function _mapMeasurementToDisplay(measurement, types, DisplaySetService) {
  const { referenceStudyUID, referenceSeriesUID, SOPInstanceUID } = measurement;

  // TODO: We don't deal with multiframe well yet, would need to update
  // This in OHIF-312 when we add FrameIndex to measurements.

  const instance = DicomMetadataStore.getInstance(
    referenceStudyUID,
    referenceSeriesUID,
    SOPInstanceUID
  );

  const displaySets = DisplaySetService.getDisplaySetsForSeries(
    referenceSeriesUID
  );

  if (!displaySets[0] || !displaySets[0].images) {
    throw new Error(
      'The tracked measurements panel should only be tracking "stack" displaySets.'
    );
  }

  const { PixelSpacing, SeriesNumber, InstanceNumber } = instance;
  const displayText = _getDisplayText(
    measurement,
    PixelSpacing,
    SeriesNumber,
    InstanceNumber,
    types
  );

  return {
    id: measurement.id,
    label: measurement.label || '(empty)',
    measurementType: measurement.type,
    displayText: displayText || [],
    isActive: false, // activeMeasurementItem === i + 1,
  };
}

/**
 *
 * @param {*} measurement
 * @param {*} pixelSpacing
 * @param {*} seriesNumber
 * @param {*} instanceNumber
 * @param {*} types
 */
function _getDisplayText(
  measurement,
  pixelSpacing,
  seriesNumber,
  instanceNumber,
  types
) {
  const { type, points } = measurement;
  const hasPixelSpacing =
    pixelSpacing !== undefined &&
    Array.isArray(pixelSpacing) &&
    pixelSpacing.length === 2;
  const [rowPixelSpacing, colPixelSpacing] = hasPixelSpacing
    ? pixelSpacing
    : [1, 1];
  const unit = hasPixelSpacing ? 'mm' : 'px';

  switch (type) {
    case types.POLYLINE: {
      const { length } = measurement;
      const roundedLength = _round(length, 2);

      return [
        `${roundedLength} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    }
    case types.BIDIRECTIONAL: {
      const { shortestDiameter, longestDiameter } = measurement;
      const roundedShortestDiameter = _round(shortestDiameter, 1);
      const roundedLongestDiameter = _round(longestDiameter, 1);

      return [
        `L: ${roundedLongestDiameter} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
        `W: ${roundedShortestDiameter} ${unit}`,
      ];
    }
    case types.ELLIPSE: {
      const { area } = measurement;
      const roundedArea = _round(area, 2);

      return [
        `${roundedArea} ${unit}<sup>2</sup> (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    }
    case types.POINT: {
      const { text } = measurement; // Will display in "short description"
      return [`(S:${seriesNumber}, I:${instanceNumber})`];
    }
  }
}

function _round(value, decimals) {
  return parseFloat(value).toFixed(decimals);
}

export default PanelMeasurementTableTracking;
