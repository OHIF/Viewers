import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { StudySummary, MeasurementTable } from '@ohif/ui';
import { DicomMetadataStore } from '@ohif/core';
import { useDebounce } from '@hooks';
import ActionButtons from './ActionButtons';
import { useTrackedMeasurements } from '../../getContextModule';

const DISPLAY_STUDY_SUMMARY_INITIAL_VALUE = {
  key: undefined, //
  date: undefined, // '07-Sep-2010',
  modality: undefined, // 'CT',
  description: undefined, // 'CHEST/ABD/PELVIS W CONTRAST',
};

function PanelMeasurementTableTracking({ servicesManager, commandsManager }) {
  const [measurementChangeTimestamp, setMeasurementsUpdated] = useState(
    Date.now().toString()
  );
  const debouncedMeasurementChangeTimestamp = useDebounce(
    measurementChangeTimestamp,
    200
  );
  const { MeasurementService } = servicesManager.services;
  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
  ] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const [displayStudySummary, setDisplayStudySummary] = useState(
    DISPLAY_STUDY_SUMMARY_INITIAL_VALUE
  );
  const [displayMeasurements, setDisplayMeasurements] = useState([]);
  // TODO: measurements subscribtion

  // Initial?
  useEffect(() => {
    const measurements = MeasurementService.getMeasurements();
    const filteredMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );
    const mappedMeasurements = filteredMeasurements.map((m, index) =>
      _mapMeasurementToDisplay(m, index)
    );
    setDisplayMeasurements(mappedMeasurements);
    // eslint-ignore-next-line
  }, [MeasurementService, trackedStudy, trackedSeries]);
  }, [
    MeasurementService,
    trackedStudy,
    trackedSeries,
    debouncedMeasurementChangeTimestamp,
  ]);

  // ~~ DisplayStudySummary
  useEffect(() => {
    if (trackedMeasurements.matches('tracking')) {
      const StudyInstanceUID = trackedStudy;
      const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
      const instanceMeta = studyMeta.series[0].instances[0];
      const { Modality, StudyDate, StudyDescription } = instanceMeta;

      if (displayStudySummary.key !== StudyInstanceUID) {
        setDisplayStudySummary({
          key: StudyInstanceUID,
          date: StudyDate, // TODO: Format: '07-Sep-2010'
          modality: Modality,
          description: StudyDescription,
        });
      }
    } else if (trackedMeasurements.matches('notTracking')) {
      setDisplayStudySummary(DISPLAY_STUDY_SUMMARY_INITIAL_VALUE);
    }
  }, [displayStudySummary.key, trackedMeasurements, trackedStudy]);

  // TODO: Listen for measurement service "adds" and updates
  // TODO: Better way to consolidated, debounce, check on change?
  // Are we exposing the right API for measurementService?
  // This watches for ALL MeasurementService changes. It updates a timestamp,
  // which is debounced. After a brief period of inactivity, this triggers
  // a re-render where we grab up-to-date measurements.
  useEffect(() => {
    const added = MeasurementService.EVENTS.MEASUREMENT_ADDED;
    const updated = MeasurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = MeasurementService.EVENTS.MEASUREMENT_REMOVED;
    const subscriptions = [];

    [added, updated, removed].forEach(evt => {
      subscriptions.push(
        MeasurementService.subscribe(evt, () => {
          setMeasurementsUpdated(Date.now().toString());
        })
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [MeasurementService, sendTrackedMeasurementsEvent]);

  const activeMeasurementItem = 0;

  return (
    <>
      <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
        {displayStudySummary.key && (
          <StudySummary
            date={displayStudySummary.date}
            modality={displayStudySummary.modality}
            description={displayStudySummary.description}
          />
        )}
        <MeasurementTable
          title="Measurements"
          amount={displayMeasurements.length}
          data={displayMeasurements}
          onClick={() => {}}
          onEdit={id => alert(`Edit: ${id}`)}
        />
      </div>
      <div className="flex justify-center p-4">
        <ActionButtons />
      </div>
    </>
  );
}

PanelMeasurementTableTracking.propTypes = {};

// TODO: This could be a MeasurementService mapper
function _mapMeasurementToDisplay(measurement, index) {
  const {
    id,
    label,
    description,
    // Reference IDs
    referenceStudyUID,
    referenceSeriesUID,
    SOPInstanceUID,
  } = measurement;
  const instance = DicomMetadataStore.getInstance(
    referenceStudyUID,
    referenceSeriesUID,
    SOPInstanceUID
  );
  const { PixelSpacing, SeriesNumber, InstanceNumber } = instance;

  console.log('mapping....', measurement);
  console.log(instance);

  return {
    id: index + 1,
    label: '(empty)', // 'Label short description',
    displayText: _getDisplayText(
      measurement.points,
      PixelSpacing,
      SeriesNumber,
      InstanceNumber
    ),
    // TODO: handle one layer down
    isActive: false, // activeMeasurementItem === i + 1,
  };
}

/**
 *
 * @param {*} points
 * @param {*} pixelSpacing
 */
function _getDisplayText(points, pixelSpacing, seriesNumber, instanceNumber) {
  // TODO: determination of shape influences text
  // Length:  'xx.x unit (S:x, I:x)'
  // Rectangle: 'xx.x x xx.x unit (S:x, I:x)',
  // Ellipse?
  // Bidirectional?
  // Freehand?

  const hasPixelSpacing =
    pixelSpacing !== undefined &&
    Array.isArray(pixelSpacing) &&
    pixelSpacing.length === 2;
  const [rowPixelSpacing, colPixelSpacing] = hasPixelSpacing
    ? pixelSpacing
    : [1, 1];
  const unit = hasPixelSpacing ? 'mm' : 'px';

  const { x: x1, y: y1 } = points[0];
  const { x: x2, y: y2 } = points[1];
  const dx = (x2 - x1) * colPixelSpacing;
  const dy = (y2 - y1) * rowPixelSpacing;
  const length = _round(Math.sqrt(dx * dx + dy * dy), 1);

  return `${length} ${unit} (S:${seriesNumber}, I:${instanceNumber})`;
}

function _round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export default PanelMeasurementTableTracking;
