import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  StudySummary,
  MeasurementTable,
  Dialog,
  Input,
  useViewportGrid,
} from '@ohif/ui';
import { DicomMetadataStore, DICOMSR, utils } from '@ohif/core';
import { useDebounce } from '@hooks';
import ActionButtons from './ActionButtons';
import { useTrackedMeasurements } from '../../getContextModule';
import createReportAsync from './../../_shared/createReportAsync.js';

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
  const { MeasurementService, UINotificationService, UIDialogService, DisplaySetService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
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

  function createReport() {
    // TODO -> Eventually deal with multiple dataSources.
    // Would need some way of saying which one is the "push" dataSource
    const dataSources = extensionManager.getDataSources();
    const dataSource = dataSources[0];
    const measurements = MeasurementService.getMeasurements();
    const trackedMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );

    return createReportAsync(servicesManager, dataSource, trackedMeasurements);
  }

  function exportReport() {
    const dataSources = extensionManager.getDataSources();
    const dataSource = dataSources[0];
    const measurements = MeasurementService.getMeasurements();
    const trackedMeasurements = measurements.filter(
      m =>
        trackedStudy === m.referenceStudyUID &&
        trackedSeries.includes(m.referenceSeriesUID)
    );

    // TODO -> local download.
    DICOMSR.downloadReport(trackedMeasurements, dataSource);
  }

  const jumpToImage = ({ id, isActive }) => {
    const measurement = MeasurementService.getMeasurement(id);
    const { referenceSeriesUID, SOPInstanceUID } = measurement;

    const displaySets = DisplaySetService.getDisplaySetsForSeries(referenceSeriesUID);
    const displaySet = displaySets.find(ds => {
      return ds.images && ds.images.some(i => i.SOPInstanceUID === SOPInstanceUID)
    });

    const imageIndex = displaySet.images.map(i => i.SOPInstanceUID).indexOf(SOPInstanceUID);

    viewportGridService.setDisplaysetForViewport({
      viewportIndex: viewportGrid.activeViewportIndex,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      imageIndex
    });

    onMeasurementItemClickHandler({ id, isActive });
  };

  const onMeasurementItemEditHandler = ({ id }) => {
    const measurement = MeasurementService.getMeasurement(id);

    let dialogId;
    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          MeasurementService.update(id, {
            ...measurement,
            ...value
          });
          UINotificationService.show({
            title: 'Measurements',
            message: 'Label updated successfully',
            type: 'success'
          });
        }
      }
      UIDialogService.dismiss({ id: dialogId });
    };
    dialogId = UIDialogService.create({
      centralize: true,
      isDraggable: false,
      useLastPosition: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: 'Enter your annotation',
        noCloseButton: true,
        value: { label: measurement.label || '' },
        body: ({ value, setValue }) => {
          const onChangeHandler = (event) => {
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
          { id: 'cancel', text: 'Cancel', type: 'secondary' },
          { id: 'save', text: 'Save', type: 'primary' },
        ],
        onSubmit: onSubmitHandler
      }
    });
  };

  const onMeasurementItemClickHandler = ({ id, isActive }) => {
    if (!isActive) {
      const measurements = [...displayMeasurements];
      const measurement = measurements.find(m => m.id === id);
      measurements.forEach(m => m.isActive = m.id !== id ? false : true);
      measurement.isActive = true;
      setDisplayMeasurements(measurements);
    }
  };

  return (
    <>
      <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
        {displayStudySummary.key && (
          <StudySummary
            date={formatDate(displayStudySummary.date)}
            modality={displayStudySummary.modality}
            description={displayStudySummary.description}
          />
        )}
        <MeasurementTable
          title="Measurements"
          amount={displayMeasurements.length}
          data={displayMeasurements}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
        />
      </div>
      <div className="flex justify-center p-4">
        <ActionButtons
          onExportClick={exportReport}
          onCreateReportClick={createReport}
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
    id: measurement.id,
    label: measurement.label || '(empty)',
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
        `l: ${roundedLongestDiameter} ${unit} (S:${seriesNumber}, I:${instanceNumber})`,
        `s: ${roundedShortestDiameter} ${unit}`,
      ];
    }
    case types.ELLIPSE: {
      const { area } = measurement;
      const roundedArea = _round(area, 2);

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
  return parseFloat(value).toFixed(decimals);
}

export default PanelMeasurementTableTracking;
