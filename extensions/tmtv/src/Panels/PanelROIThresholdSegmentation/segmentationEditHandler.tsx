import React from 'react';
import { Input, Dialog } from '@ohif/ui';

function segmentationItemEditHandler({ id, servicesManager }) {
  const { SegmentationService, UIDialogService } = servicesManager.services;

  const segmentation = SegmentationService.getSegmentation(id);

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save': {
        SegmentationService.addOrUpdateSegmentation(
          {
            ...segmentation,
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
      title: 'Enter your Segmentation',
      noCloseButton: true,
      value: { label: segmentation.label || '' },
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
}

export default segmentationItemEditHandler;
