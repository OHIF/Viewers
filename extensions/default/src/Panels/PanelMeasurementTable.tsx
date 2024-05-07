import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { utils } from '@ohif/core';
import {
  MeasurementTable,
  Dialog,
  Input,
  useViewportGrid,
  ButtonEnums,
  ActionButtons,
} from '@ohif/ui';
import debounce from 'lodash.debounce';

import createReportDialogPrompt, {
  CREATE_REPORT_DIALOG_RESPONSE,
} from './createReportDialogPrompt';
import createReportAsync from '../Actions/createReportAsync';
import findSRWithSameSeriesDescription from '../utils/findSRWithSameSeriesDescription';

const { downloadCSVReport } = utils;

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
  extensionManager,
}: withAppTypes): React.FunctionComponent {
  const { t } = useTranslation('MeasurementTable');

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { activeViewportId, viewports } = viewportGrid;
  const { measurementService, uiDialogService, uiNotificationService, displaySetService } =
    servicesManager.services;
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  useEffect(() => {
    const debouncedSetDisplayMeasurements = debounce(setDisplayMeasurements, 100);
    // ~~ Initial
    setDisplayMeasurements(_getMappedMeasurements(measurementService));

    // ~~ Subscription
    const added = measurementService.EVENTS.MEASUREMENT_ADDED;
    const addedRaw = measurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const updated = measurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = measurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = measurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, addedRaw, updated, removed, cleared].forEach(evt => {
      subscriptions.push(
        measurementService.subscribe(evt, () => {
          debouncedSetDisplayMeasurements(_getMappedMeasurements(measurementService));
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
    const measurements = measurementService.getMeasurements();

    downloadCSVReport(measurements, measurementService);
  }

  async function clearMeasurements() {
    measurementService.clearMeasurements();
  }

  async function createReport(): Promise<any> {
    // filter measurements that are added to the active study
    const activeViewport = viewports.get(activeViewportId);
    const measurements = measurementService.getMeasurements();
    const displaySet = displaySetService.getDisplaySetByUID(
      activeViewport.displaySetInstanceUIDs[0]
    );
    const trackedMeasurements = measurements.filter(
      m => displaySet.StudyInstanceUID === m.referenceStudyUID
    );

    if (trackedMeasurements.length <= 0) {
      uiNotificationService.show({
        title: 'No Measurements',
        message: 'No Measurements are added to the current Study.',
        type: 'info',
        duration: 3000,
      });
      return;
    }

    const promptResult = await createReportDialogPrompt(uiDialogService, {
      extensionManager,
    });

    if (promptResult.action === CREATE_REPORT_DIALOG_RESPONSE.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources(promptResult.dataSourceName);
      const dataSource = dataSources[0];

      const SeriesDescription =
        // isUndefinedOrEmpty
        promptResult.value === undefined || promptResult.value === ''
          ? 'Research Derived Series' // default
          : promptResult.value; // provided value

      // Reuse an existing series having the same series description to avoid
      // creating too many series instances.
      const options = findSRWithSameSeriesDescription(SeriesDescription, displaySetService);

      const getReport = async () => {
        return commandsManager.runCommand(
          'storeMeasurements',
          {
            measurementData: trackedMeasurements,
            dataSource,
            additionalFindingTypes: ['ArrowAnnotate'],
            options,
          },
          'CORNERSTONE_STRUCTURED_REPORT'
        );
      };

      return createReportAsync({ servicesManager, getReport });
    }
  }

  const jumpToImage = ({ uid, isActive }) => {
    measurementService.jumpToMeasurement(viewportGrid.activeViewportId, uid);

    onMeasurementItemClickHandler({ uid, isActive });
  };

  const onMeasurementItemEditHandler = ({ uid, isActive }) => {
    const measurement = measurementService.getMeasurement(uid);
    //Todo: why we are jumping to image?
    // jumpToImage({ id, isActive });

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          measurementService.update(
            uid,
            {
              ...measurement,
              ...value,
            },
            true
          );
        }
      }
      uiDialogService.dismiss({ id: 'enter-annotation' });
    };

    uiDialogService.create({
      id: 'enter-annotation',
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: 'Annotation',
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
            <Input
              label="Enter your annotation"
              labelClassName="text-white text-[14px] leading-[1.2]"
              autoFocus
              id="annotation"
              className="border-primary-main bg-black"
              type="text"
              value={value.label}
              onChange={onChangeHandler}
              onKeyPress={onKeyPressHandler}
            />
          );
        },
        actions: [
          { id: 'cancel', text: 'Cancel', type: ButtonEnums.type.secondary },
          { id: 'save', text: 'Save', type: ButtonEnums.type.primary },
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
        className="ohif-scrollbar overflow-y-auto overflow-x-hidden"
        data-cy={'measurements-panel'}
      >
        <MeasurementTable
          title={t('Measurements')}
          servicesManager={servicesManager}
          data={displayMeasurements}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
        />
      </div>
      <div className="flex justify-center p-4">
        <ActionButtons
          t={t}
          actions={[
            {
              label: 'Export',
              onClick: exportReport,
            },
            {
              label: 'Create Report',
              onClick: createReport,
            },
          ]}
        />
      </div>
    </>
  );
}

PanelMeasurementTable.propTypes = {
  servicesManager: PropTypes.object.isRequired,
};

function _getMappedMeasurements(measurementService) {
  const measurements = measurementService.getMeasurements();

  const mappedMeasurements = measurements.map((m, index) =>
    _mapMeasurementToDisplay(m, index, measurementService.VALUE_TYPES)
  );

  return mappedMeasurements;
}

/**
 * Map the measurements to the display text.
 * Adds finding and site information to the displayText and/or label,
 * and provides as 'displayText' and 'label', while providing the original
 * values as baseDisplayText and baseLabel
 */
function _mapMeasurementToDisplay(measurement, index, types) {
  const {
    displayText: baseDisplayText,
    uid,
    label: baseLabel,
    type,
    selected,
    findingSites,
    finding,
  } = measurement;

  const firstSite = findingSites?.[0];
  const label = baseLabel || finding?.text || firstSite?.text || '(empty)';
  let displayText = baseDisplayText || [];
  if (findingSites) {
    const siteText = [];
    findingSites.forEach(site => {
      if (site?.text !== label) {
        siteText.push(site.text);
      }
    });
    displayText = [...siteText, ...displayText];
  }
  if (finding && finding?.text !== label) {
    displayText = [finding.text, ...displayText];
  }

  return {
    uid,
    label,
    baseLabel,
    measurementType: type,
    displayText,
    baseDisplayText,
    isActive: selected,
    finding,
    findingSites,
  };
}
