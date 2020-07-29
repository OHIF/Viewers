import React from 'react';
import { Dialog, Input } from '@ohif/ui';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
};

export default function createReportDialogPrompt(UIDialogService) {
  return new Promise(function(resolve, reject) {
    let dialogId = undefined;

    const _handleClose = () => {
      // Dismiss dialog
      UIDialogService.dismiss({ id: dialogId });
      // Notify of cancel action
      resolve({ action: RESPONSE.CANCEL, value: undefined });
    };

    /**
     *
     * @param {string} param0.action - value of action performed
     * @param {string} param0.value - value from input field
     */
    const _handleFormSubmit = ({ action, value }) => {
      UIDialogService.dismiss({ id: dialogId });
      switch (action.id) {
        case 'save':
          resolve({ action: RESPONSE.CREATE_REPORT, value: value.label });
          break;
        case 'cancel':
          resolve({ action: RESPONSE.CANCEL, value: undefined });
          break;
      }
    };

    dialogId = UIDialogService.create({
      centralize: true,
      isDraggable: false,
      content: Dialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Provide a name for your report',
        value: { label: '' },
        noCloseButton: true,
        onClose: _handleClose,
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'secondary' },
          { id: 'save', text: 'Save', type: 'primary' },
        ],
        // TODO: Should be on button press...
        onSubmit: _handleFormSubmit,
        body: ({ value, setValue }) => {
          const onChangeHandler = event => {
            event.persist();
            setValue(value => ({ ...value, label: event.target.value }));
          };
          const onKeyPressHandler = event => {
            if (event.key === 'Enter') {
              UIDialogService.dismiss({ id: dialogId });
              resolve({ action: RESPONSE.CREATE_REPORT, value });
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
  });
}
