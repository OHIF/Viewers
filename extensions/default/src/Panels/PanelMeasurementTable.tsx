import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MeasurementTable, Dialog, Input, useViewportGrid } from '@ohif/ui';
import ActionButtons from './ActionButtons';
import debounce from 'lodash.debounce';

import { utils } from '@ohif/core';

const { downloadCSVReport } = utils;

// tools with measurements to display inside the panel
const MEASUREMENT_TOOLS = [
  'EllipticalROI',
  'RectangleROI',
  'Length',
  'Bidirectional',
];

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
}) {
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { MeasurementService, UIDialogService } = servicesManager.services;
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
    const addedRaw = MeasurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const updated = MeasurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = MeasurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = MeasurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, addedRaw, updated, removed, cleared].forEach(evt => {
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
      debouncedSetDisplayMeasurements.cancel();
    };
  }, []);

  async function exportReport() {
    const measurements = MeasurementService.getMeasurements();

    downloadCSVReport(measurements, MeasurementService);
  }

  const jumpToImage = ({ uid, isActive }) => {
    MeasurementService.jumpToMeasurement(viewportGrid.activeViewportIndex, uid);

    onMeasurementItemClickHandler({ uid, isActive });
  };

  const onMeasurementItemEditHandler = ({ uid, isActive }) => {
    const measurement = MeasurementService.getMeasurement(uid);
    //Todo: why we are jumping to image?
    // jumpToImage({ id, isActive });

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          MeasurementService.update(
            uid,
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

  const onMeasurementItemClickHandler = ({ uid, isActive }) => {
    if (!isActive) {
      const measurements = [...displayMeasurements];
      const measurement = measurements.find(m => m.uid === uid);

      measurements.forEach(m => (m.isActive = m.uid !== uid ? false : true));
      measurement.isActive = true;
      setDisplayMeasurements(measurements);
    }
  };

  return (
    <>
      <div
        className="overflow-x-hidden overflow-y-auto invisible-scrollbar"
        data-cy={'measurements-panel'}
      >
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
          onCreateReportClick={() => {}}
        />
      </div>
    </>
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
  // filter out measurements whose toolName is not in MEASUREMENT_TOOLS
  const measurementTools = measurements.filter(measurement =>
    MEASUREMENT_TOOLS.includes(measurement.toolName)
  );

  const mappedMeasurements = measurementTools.map((m, index) =>
    _mapMeasurementToDisplay(m, index, MeasurementService.VALUE_TYPES)
  );

  return mappedMeasurements;
}

function _mapMeasurementToDisplay(measurement, index, types) {
  const { displayText, uid, label, type } = measurement;

  return {
    uid,
    label: label || '(empty)',
    measurementType: type,
    displayText: displayText || [],
    // TODO: handle one layer down
    isActive: false, // activeMeasurementItem === i + 1,
  };
}
