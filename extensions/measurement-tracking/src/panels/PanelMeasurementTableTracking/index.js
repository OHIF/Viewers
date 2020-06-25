import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { StudySummary, MeasurementTable } from '@ohif/ui';
import { DicomMetadataStore, DICOMSR } from '@ohif/core';
import { useDebounce } from '@hooks';
import ActionButtons from './ActionButtons';
import { useTrackedMeasurements } from '../../getContextModule';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import dcmjs from 'dcmjs';

const DISPLAY_STUDY_SUMMARY_INITIAL_VALUE = {
  key: undefined, //
  date: undefined, // '07-Sep-2010',
  modality: undefined, // 'CT',
  description: undefined, // 'CHEST/ABD/PELVIS W CONTRAST',
};

function PanelMeasurementTableTracking({ servicesManager, extensionManager }) {
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
      _mapMeasurementToDisplay(m, index, MeasurementService.VALUE_TYPES)
    );
    setDisplayMeasurements(mappedMeasurements);
    // eslint-ignore-next-line
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
    } else if (trackedStudy === '' || trackedStudy === undefined) {
      setDisplayStudySummary(DISPLAY_STUDY_SUMMARY_INITIAL_VALUE);
    }
  }, [displayStudySummary.key, trackedMeasurements, trackedStudy]);

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
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [MeasurementService, sendTrackedMeasurementsEvent]);

  const activeMeasurementItem = 0;

  const onExportClick = () => {
    const measurements = MeasurementService.getMeasurements();
    const trackedMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );

    // TODO -> local download.
    DICOMSR.downloadReport(trackedMeasurements, dataSource);
  };

  const onCreateReportClick = () => {
    const measurements = MeasurementService.getMeasurements();
    const trackedMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );

    console.log(servicesManager);
    console.log(extensionManager);

    const dataSources = extensionManager.getDataSources();
    // TODO -> Eventually deal with multiple dataSources.
    // Would need some way of saying which one is the "push" dataSource
    const dataSource = dataSources[0];

    DICOMSR.storeMeasurements(trackedMeasurements, dataSource);
  };

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
        <ActionButtons
          onExportClick={onExportClick}
          onCreateReportClick={onCreateReportClick}
        />
      </div>
    </>
  );
}

PanelMeasurementTableTracking.propTypes = {};

// TODO: This could be a MeasurementService mapper
function _mapMeasurementToDisplay(measurement, index, types) {
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
    displayText:
      _getDisplayText(
        measurement,
        PixelSpacing,
        SeriesNumber,
        InstanceNumber,
        types
      ) || [],
    // TODO: handle one layer down
    isActive: false, // activeMeasurementItem === i + 1,
  };
}

/**
 *
 * @param {*} points
 * @param {*} pixelSpacing
 */
function _getDisplayText(
  measurement,
  pixelSpacing,
  seriesNumber,
  instanceNumber,
  types
) {
  // TODO: determination of shape influences text
  // Length:  'xx.x unit (S:x, I:x)'
  // Rectangle: 'xx.x x xx.x unit (S:x, I:x)',
  // Ellipse?
  // Bidirectional?
  // Freehand?

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
    case types.POLYLINE:
      const { length } = measurement;

      const roundedLength = _round(length, 1);

      return [
        `${roundedLength} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
      ];

    case types.BIDIRECTIONAL:
      const { shortestDiameter, longestDiameter } = measurement;

      const roundedShortestDiameter = _round(shortestDiameter, 1);
      const roundedLongestDiameter = _round(longestDiameter, 1);

      return [
        `l: ${roundedLongestDiameter} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
        `s: ${roundedShortestDiameter} ${unit}`,
      ];
    case types.ELLIPSE:
      const { area } = measurement;

      const roundedArea = _round(area, 1);
      return [
        `${roundedArea} ${unit}2 (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    case types.POINT:
      const { text } = measurement;
      return [`${text} (S:${seriesNumber}, I:${instanceNumber})`];
  }
}

function _round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export default PanelMeasurementTableTracking;
