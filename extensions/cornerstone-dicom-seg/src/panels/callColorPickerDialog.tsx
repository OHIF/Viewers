import React from 'react';
import { Dialog } from '@ohif/ui';
import { SketchPicker } from 'react-color';

function callColorPickerDialog(UIDialogService, rgbaColor, callback) {
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
        title: 'Segment Color',
        value: {rgbaColor},
        noCloseButton: true,
        onClose: () => UIDialogService.dismiss({ id: dialogId }),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
        body: ({ value, setValue }) => {
          const handleChange = (color) => {
            setValue({rgbaColor: color.rgb})
          };


            return (
              <SketchPicker
                color={ value.rgbaColor }
                onChange={ handleChange }
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
