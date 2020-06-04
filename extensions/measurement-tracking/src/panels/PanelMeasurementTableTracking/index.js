import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { StudySummary, MeasurementTable } from '@ohif/ui';
import { DicomMetadataStore } from '@ohif/core';
import ActionButtons from './ActionButtons';
import { useTrackedMeasurements } from '../../getContextModule';

function PanelMeasurementTableTracking({ servicesManager, commandsManager }) {
  const { MeasurementService } = servicesManager.services;
  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
  ] = useTrackedMeasurements();
  const [displayStudySummary, setDisplayStudySummary] = useState({
    date: '', // '07-Sep-2010',
    modality: '', // 'CT',
    description: '', // 'CHEST/ABD/PELVIS W CONTRAST',
  });
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  // TODO: initial measurements + initial tracked?
  // TODO: measurements subscribtion
  // TODO: tracked changes

  // Initial?
  useEffect(() => {
    const measurements = MeasurementService.getMeasurements();
    const mappedMeasurements = measurements.map((m, index) =>
      _mapMeasurementToDisplay(m, index)
    );
    setDisplayMeasurements(mappedMeasurements);
    // eslint-ignore-next-line
  }, [MeasurementService, trackedMeasurements]);

  // TODO: Listen for measurement service "adds" (really shouldn't be added until cornerstone-tools "complete")
  useEffect(() => {
    // const { unsubscribe } = MeasurementService.subscribe(
    //   MeasurementService.EVENTS.MEASUREMENT_ADDED,
    //   ({ source, measurement }) => {
    //     const {
    //       referenceSeriesUID: SeriesInstanceUID,
    //       referenceStudyUID: StudyInstanceUID,
    //     } = measurement;
    //     sendTrackedMeasurementsEvent('TRACK_SERIES', {
    //       StudyInstanceUID,
    //       SeriesInstanceUID,
    //     });
    //     console.log('PANEL:', measurement);
    //     // console.log('Mapped:', annotation);
    //   }
    // );
    // return unsubscribe;
  }, [MeasurementService, sendTrackedMeasurementsEvent]);

  const activeMeasurementItem = 0;

  return (
    <>
      <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
        <StudySummary
          date={displayStudySummary.date}
          modality={displayStudySummary.modality}
          description={displayStudySummary.description}
        />
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
  const dx = x2 - x1 * colPixelSpacing;
  const dy = y2 - y1 * rowPixelSpacing;
  const length = _round(Math.sqrt(dx * dx + dy * dy), 1);

  return `${length} ${unit} (S:${seriesNumber}, I:${instanceNumber})`;
}

function _round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export default PanelMeasurementTableTracking;
