import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MeasurementTable } from '@ohif/ui';
import { DicomMetadataStore } from '@ohif/core';
import debounce from './debounce.js';

export default function PanelMeasurementTable({
  servicesManager,
  // commandsManager,
}) {
  const { MeasurementService } = servicesManager.services;
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  useEffect(() => {
    const debouncedSetDisplayMeasurements = debounce(
      setDisplayMeasurements,
      100
    );
    // ~~ Initial
    setDisplayMeasurements(_getMappedMeasurements(MeasurementService));

    // ~~ Subscription
    const added = MeasurementService.EVENTS.MEASUREMENT_ADDED;
    const updated = MeasurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = MeasurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = MeasurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, updated, removed, cleared].forEach(evt => {
      subscriptions.push(
        MeasurementService.subscribe(evt, () => {
          debouncedSetDisplayMeasurements(
            _getMappedMeasurements(MeasurementService)
          );
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
    };
  }, [MeasurementService]);

  return (
    <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
      <MeasurementTable
        title="Measurements"
        amount={displayMeasurements.length}
        data={displayMeasurements}
        onClick={({ id }) => alert(`Click: ${id}`)}
        onEdit={({ id }) => alert(`Edit: ${id}`)}
      />
    </div>
  );
}

PanelMeasurementTable.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      MeasurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

function _getMappedMeasurements(MeasurementService) {
  const measurements = MeasurementService.getMeasurements();
  const mappedMeasurements = measurements.map((m, index) =>
    _mapMeasurementToDisplay(m, index, MeasurementService.VALUE_TYPES)
  );

  return mappedMeasurements;
}

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
      const roundedLength = _round(length, 1);

      return [
        `${roundedLength} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    }
    case types.BIDIRECTIONAL: {
      const { shortestDiameter, longestDiameter } = measurement;
      const roundedShortestDiameter = _round(shortestDiameter, 1);
      const roundedLongestDiameter = _round(longestDiameter, 1);

      return [
        `l: ${roundedLongestDiameter} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
        `s: ${roundedShortestDiameter} ${unit}`,
      ];
    }
    case types.ELLIPSE: {
      const { area } = measurement;
      const roundedArea = _round(area, 1);

      return [
        `${roundedArea} ${unit}2 (S:${seriesNumber}, I:${instanceNumber})`,
      ];
    }
    case types.POINT: {
      const { text } = measurement;
      return [`${text} (S:${seriesNumber}, I:${instanceNumber})`];
    }
  }
}

function _round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}
