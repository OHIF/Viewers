import React from 'react';
import { Input, Dialog } from '@ohif/ui';

/**
 *
 * @param {*} data
 * @param {*} data.text
 * @param {*} data.label
 * @param {*} event
 * @param {func} callback
 * @param {*} isArrowAnnotateInputDialog
 */
export default function callInputDialog({
  uiDialogService,
  title = 'Enter your annotation',
  defaultValue = '',
  callback = (value: string, action: string) => {}
}) {
  const dialogId = 'microscopy-input-dialog';

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save':
        callback(value.value, action.id);
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
        title: title,
        value: { value: defaultValue },
        noCloseButton: true,
        onClose: () => uiDialogService.dismiss({ id: dialogId }),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
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
                value={value.defaultValue}
                onChange={event => {
                  event.persist();
                  setValue(value => ({ ...value, value: event.target.value }));
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