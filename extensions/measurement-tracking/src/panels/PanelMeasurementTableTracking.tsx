import React from 'react';
import { utils } from '@ohif/core';
import { useViewportGrid, Button, Icons, MeasurementTable } from '@ohif/ui-next';
import { Dialog, ButtonEnums } from '@ohif/ui';
import { PanelMeasurement, StudySummaryFromMetadata } from '@ohif/extension-cornerstone';
import { useTrackedMeasurements } from '../getContextModule';

const { filterAnd, filterPlanarMeasurement, filterMeasurementsBySeriesUID } =
  utils.MeasurementFilters;

function PanelMeasurementTableTracking({
  servicesManager,
  extensionManager,
  commandsManager,
}: withAppTypes) {
  const [viewportGrid] = useViewportGrid();
  const { customizationService, measurementService, uiDialogService } = servicesManager.services;
  const [trackedMeasurements, sendTrackedMeasurementsEvent] = useTrackedMeasurements();
  const { trackedStudy, trackedSeries } = trackedMeasurements.context;
  const measurementFilter = trackedStudy
    ? filterAnd(filterPlanarMeasurement, filterMeasurementsBySeriesUID(trackedSeries))
    : filterPlanarMeasurement;

  const disableEditing = customizationService.getCustomization('panelMeasurement.disableEditing');
  const onUntrackConfirm = () => {
    sendTrackedMeasurementsEvent('UNTRACK_ALL', {});
  };

  const hasDirtyMeasurements = measurementService
    .getMeasurements()
    .some(measurement => measurement.isDirty);

  const onUntrackClick = event => {
    event.stopPropagation();
    hasDirtyMeasurements
      ? uiDialogService.create({
          id: 'untrack-and-delete-all-measurements',
          centralize: true,
          isDraggable: false,
          showOverlay: true,
          content: Dialog,
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
            onClose: () => uiDialogService.dismiss({ id: 'untrack-and-delete-all-measurements' }),
            onSubmit: async ({ action }) => {
              switch (action.id) {
                case 'yes':
                  onUntrackConfirm();
                  uiDialogService.dismiss({ id: 'untrack-and-delete-all-measurements' });
                  break;
                case 'cancel':
                  uiDialogService.dismiss({ id: 'untrack-and-delete-all-measurements' });
                  break;
              }
            },
            onStart: () => {
              console.log('Dialog drag started');
            },
            onDrag: (_event: unknown, data: unknown) => {
              console.log('Dialog is being dragged', data);
            },
            onStop: () => {
              console.log('Dialog drag stopped');
            },
            defaultPosition: { x: 0, y: 0 },
            onClickOutside: () => {
              uiDialogService.dismiss({ id: 'delete-all-measurements' });
            },
          },
        })
      : onUntrackConfirm();
  };

  function CustomMenu({ items, StudyInstanceUID, measurementFilter }) {
    const disabled = !items?.length;

    if (disableEditing || disabled) {
      return null;
    }

    return (
      <div className="bg-background flex h-9 w-full items-center rounded pr-0.5">
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            className="pl-1.5"
            onClick={() => {
              commandsManager.runCommand('downloadCSVMeasurementsReport', {
                measurementFilter,
              });
            }}
          >
            <Icons.Download className="h-5 w-5" />
            <span className="pl-1">CSV</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="pl-0.5"
            onClick={() => {
              sendTrackedMeasurementsEvent('SAVE_REPORT', {
                viewportId: viewportGrid.activeViewportId,
                isBackupSave: true,
                StudyInstanceUID,
                measurementFilter,
              });
            }}
          >
            <Icons.Add />
            Create SR
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="pl-0.5"
            onClick={() => {
              commandsManager.runCommand('clearMeasurements', {
                measurementFilter,
              });
            }}
          >
            <Icons.Delete />
            Delete All
          </Button>
        </div>
      </div>
    );
  }

  const EmptyComponent = () => (
    <MeasurementTable title="Measurements">
      <MeasurementTable.Body />
    </MeasurementTable>
  );

  return (
    <>
      <PanelMeasurement
        servicesManager={servicesManager}
        extensionManager={extensionManager}
        commandsManager={commandsManager}
        measurementFilter={measurementFilter}
        emptyComponent={EmptyComponent}
        onUntrackClick={onUntrackClick}
        componentProps={{
          grouping: {
            header: props => (
              <>
                <StudySummaryFromMetadata {...props} />
                <CustomMenu {...props} />
              </>
            ),
          },
        }}
      ></PanelMeasurement>
    </>
  );
}

export default PanelMeasurementTableTracking;
