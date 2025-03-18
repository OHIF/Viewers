import React from 'react';
import { Dialog, ButtonEnums } from '@ohif/ui';
import { utils } from '@ohif/core';
import { MeasurementTable, useViewportGrid } from '@ohif/ui-next';
import {
  PanelMeasurement,
  StudyMeasurements,
  StudyMeasurementsActions,
  StudySummaryFromMetadata,
  AccordionGroup,
} from '@ohif/extension-cornerstone';

import { useTrackedMeasurements } from '../getContextModule';

const { filterAnd, filterPlanarMeasurement, filterMeasurementsBySeriesUID } =
  utils.MeasurementFilters;

function PanelMeasurementTableTracking(props) {
  const [viewportGrid] = useViewportGrid();
  const { measurementService, uiDialogService } = props.servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const measurementFilter = trackedStudy
    ? filterAnd(filterPlanarMeasurement, filterMeasurementsBySeriesUID(trackedSeries))
    : filterPlanarMeasurement;

  const onUntrackConfirm = () => {
    sendTrackedMeasurementsEvent('UNTRACK_ALL', {});
  };
  const hasDirtyMeasurements = measurementService
    .getMeasurements()
    .some(measurement => measurement.isDirty);

  const onUntrackClick = event => {
    event.stopPropagation();
    hasDirtyMeasurements
      ? uiDialogService.show({
          id: 'untrack-and-delete-all-measurements',
          content: Dialog,
          isDraggable: false,
          showOverlay: true,
          contentProps: {
            title: 'Untrack and Delete All Measurements',
            body: () => (
              <div className="bg-primary-dark text-white">
                <p>Are you sure you want to untrack study and delete all measurements?</p>
                <p className="mt-2">This action cannot be undone.</p>
              </div>
            ),
            actions: [
              {
                id: 'cancel',
                text: 'Cancel',
                type: ButtonEnums.type.secondary,
              },
              {
                id: 'yes',
                text: 'Untrack and Delete All',
                type: ButtonEnums.type.primary,
                classes: ['untrack-and-delete-all-yes-button'],
              },
            ],
            onClose: () => uiDialogService.hide('untrack-and-delete-all-measurements'),
            onSubmit: async ({ action }) => {
              switch (action.id) {
                case 'yes':
                  onUntrackConfirm();
                  uiDialogService.hide('untrack-and-delete-all-measurements');
                  break;
                case 'cancel':
                  uiDialogService.hide('untrack-and-delete-all-measurements');
                  break;
              }
            },
          },
        })
      : onUntrackConfirm();
  };

  const EmptyComponent = () => (
    <MeasurementTable
      title="Measurements"
      isExpanded={false}
    >
      <MeasurementTable.Body />
    </MeasurementTable>
  );

  const actions = {
    createSR: ({ StudyInstanceUID }) => {
      sendTrackedMeasurementsEvent('SAVE_REPORT', {
        viewportId: viewportGrid.activeViewportId,
        isBackupSave: true,
        StudyInstanceUID,
        measurementFilter,
      });
    },
    onUntrackClick,
  };

  const Header = props => (
    <div data-cy="TrackingHeader">
      <StudySummaryFromMetadata {...props} />
      <StudyMeasurementsActions
        {...props}
        actions={actions}
      />
    </div>
  );

  return (
    <PanelMeasurement
      measurementFilter={measurementFilter}
      emptyComponent={EmptyComponent}
      sourceChildren={props.children}
    >
      <StudyMeasurements grouping={props.grouping}>
        <AccordionGroup.Trigger>
          <Header />
        </AccordionGroup.Trigger>
      </StudyMeasurements>
    </PanelMeasurement>
  );
}

export default PanelMeasurementTableTracking;
