import React from 'react';
import { Input, Dialog, ButtonEnums } from '@ohif/ui';

function callInputDialog(
  uiDialogService,
  dialogTitle,
  dialogLabel,
  inputLabel,
  callback
) {
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
    uiDialogService.dismiss({ id: dialogId });
  };

  if (uiDialogService) {
    uiDialogService.create({
      id: dialogId,
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: dialogTitle,
        value: { inputLabel },
        noCloseButton: true,
        onClose: () => uiDialogService.dismiss({ id: dialogId }),
        actions: [
          { id: 'cancel', text: 'Cancel', type: ButtonEnums.type.secondary },
          { id: 'save', text: 'Confirm', type: ButtonEnums.type.primary },
        ],
        onSubmit: onSubmitHandler,
        body: ({ value, setValue }) => {
          return (
            <Input
              label={dialogLabel}
              labelClassName="text-white text-[14px] leading-[1.2]"
              autoFocus
              className="bg-black border-primary-main"
              type="text"
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
          );
        },
      },
    });
  }
}

export default callInputDialog;
