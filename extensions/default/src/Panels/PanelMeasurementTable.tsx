import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MeasurementTable, Dialog, Input, useViewportGrid } from '@ohif/ui';
import ActionButtons from './ActionButtons';
import debounce from 'lodash.debounce';

import { utils } from '@ohif/core';
import createReportDialogPrompt, {
  CREATE_REPORT_DIALOG_RESPONSE,
} from './createReportDialogPrompt';
import createReportAsync from '../Actions/createReportAsync';
import getNextSRSeriesNumber from '../utils/getNextSRSeriesNumber';

const { downloadCSVReport } = utils;

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
  extensionManager,
}) {
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { activeViewportIndex, viewports } = viewportGrid;
  const {
    MeasurementService,
    UIDialogService,
    UINotificationService,
    DisplaySetService,
  } = servicesManager.services;
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

  async function clearMeasurements() {
    MeasurementService.clearMeasurements();
  }

  async function createReport() {
    // filter measurements that are added to the active study
    const activeViewport = viewports[activeViewportIndex];
    const measurements = MeasurementService.getMeasurements();
    const displaySet = DisplaySetService.getDisplaySetByUID(
      activeViewport.displaySetInstanceUIDs[0]
    );
    const trackedMeasurements = measurements.filter(
      m => displaySet.StudyInstanceUID === m.referenceStudyUID
    );

    if (trackedMeasurements.length <= 0) {
      UINotificationService.show({
        title: 'No Measurements',
        message: 'No Measurements are added to the current Study.',
        type: 'info',
        duration: 3000,
      });
      return;
    }

    const promptResult = await createReportDialogPrompt(UIDialogService, {
      extensionManager,
    });

    if (promptResult.action === CREATE_REPORT_DIALOG_RESPONSE.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources(
        promptResult.dataSourceName
      );
      const dataSource = dataSources[0];

      const SeriesDescription =
        // isUndefinedOrEmpty
        promptResult.value === undefined || promptResult.value === ''
          ? 'Research Derived Series' // default
          : promptResult.value; // provided value

      const SeriesNumber = getNextSRSeriesNumber(DisplaySetService);

      const displaySetInstanceUIDs = await createReportAsync(
        servicesManager,
        commandsManager,
        dataSource,
        trackedMeasurements,
        {
          SeriesDescription,
          SeriesNumber,
        }
      );
    }
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
        className="overflow-x-hidden overflow-y-auto ohif-scrollbar"
        data-cy={'measurements-panel'}
      >
        <MeasurementTable
          title="Measurements"
          data={displayMeasurements}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
        />
      </div>
      <div className="flex justify-center p-4">
        <ActionButtons
          onExportClick={exportReport}
          onClearMeasurementsClick={clearMeasurements}
          onCreateReportClick={createReport}
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

  const mappedMeasurements = measurements.map((m, index) =>
    _mapMeasurementToDisplay(m, index, MeasurementService.VALUE_TYPES)
  );

  return mappedMeasurements;
}

function _mapMeasurementToDisplay(measurement, index, types) {
  const { displayText, uid, label, type, selected } = measurement;

  return {
    uid,
    label: label || '(empty)',
    measurementType: type,
    displayText: displayText || [],
    isActive: selected,
  };
}
