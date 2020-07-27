import React from 'react';
import { DICOMSR } from '@ohif/core';
import { Dialog, Input } from '@ohif/ui';

async function createReportAsync(servicesManager, dataSource, measurements) {
  const {
    UINotificationService,
    UIDialogService,
    DisplaySetService,
  } = servicesManager.services;
  const loadingDialogId = UIDialogService.create({
    showOverlay: true,
    isDraggable: false,
    centralize: true,
    // TODO: Create a loading indicator component + zeplin design?
    content: Loading,
  });

  try {
    UIDialogService.create({
      id: 'report-title',
      centralize: true,
      isDraggable: false,
      content: Dialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Report title',
        value: '',
        noCloseButton: true,
        onClose: () => UIDialogService.dismiss({ id: 'report-title' }),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'secondary' },
          { id: 'save', text: 'Save', type: 'primary' },
        ],
        onSubmit: async ({ action, value }) => {
          const { SeriesDescription } = value;
          switch (action.id) {
            case 'save': {
              const naturalizedReportValues = { SeriesDescription };

              const naturalizedReport = await DICOMSR.storeMeasurements(
                measurements,
                dataSource,
                ['ArrowAnnotate'],
                naturalizedReportValues
              );

              DisplaySetService.makeDisplaySets([naturalizedReport], { madeInClient: true });
              UINotificationService.show({
                title: 'Create Report',
                message: 'Measurements saved successfully',
                type: 'success',
              });

              break;
            }
            case 'cancel':
              break;
          }
          UIDialogService.dismiss({ id: 'report-title' });
        },
        body: ({ value, setValue }) => {
          const onChangeHandler = event => {
            event.persist();
            setValue(value => ({ ...value, SeriesDescription: event.target.value }));
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
      },
    });
  } catch (error) {
    UINotificationService.show({
      title: 'Create Report',
      message: error.message || 'Failed to store measurements',
      type: 'error',
    });
  } finally {
    UIDialogService.dismiss({ id: loadingDialogId });
  }
}

function Loading() {
  return <div className="text-primary-active">Loading...</div>;
}

export default createReportAsync;
