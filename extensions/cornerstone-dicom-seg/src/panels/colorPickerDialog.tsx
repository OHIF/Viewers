import React from 'react';
import { Dialog } from '@ohif/ui';
import { ChromePicker } from 'react-color';

import './colorPickerDialog.css';

function callColorPickerDialog(uiDialogService, rgbaColor, callback) {
  const dialogId = 'pick-color';

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save':
        callback(value.rgbaColor, action.id);
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
        title: 'Segment Color',
        value: { rgbaColor },
        noCloseButton: true,
        onClose: () => uiDialogService.dismiss({ id: dialogId }),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
        body: ({ value, setValue }) => {
          const handleChange = color => {
            setValue({ rgbaColor: color.rgb });
          };

          return (
            <ChromePicker
              color={value.rgbaColor}
              onChange={handleChange}
              presetColors={[]}
              width={300}
            />
          );
        },
      },
    });
  }
}

export default callColorPickerDialog;
