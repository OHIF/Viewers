import React from 'react';
import { Input, Dialog } from '@ohif/ui';

function callInputDialog(UIDialogService, label, callback) {
  const dialogId = 'enter-segment-label';

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save':
        callback(value.label, action.id);
        break;
      case 'cancel':
        callback('', action.id);
        break;
    }
    UIDialogService.dismiss({ id: dialogId });
  };

  if (UIDialogService) {
    UIDialogService.create({
      id: dialogId,
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: 'Enter Segment Label',
        value: { label },
        noCloseButton: true,
        onClose: () => UIDialogService.dismiss({ id: dialogId }),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Confirm', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
        body: ({ value, setValue }) => {
          return (
            <div className="p-4 bg-primary-dark">
              <Input
                autoFocus
                className="mt-2 bg-black border-primary-main"
                type="text"
                containerClassName="mr-2"
                value={value.label}
                onChange={event => {
                  event.persist();
                  setValue(value => ({ ...value, label: event.target.value }));
                }}
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    onSubmitHandler({ value, action: { id: 'save' } });
                  }
                }}
              />
            </div>
          );
        },
      },
    });
  }
}

export default callInputDialog;
