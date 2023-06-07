/* eslint-disable react/display-name */
import React from 'react';
import { Dialog, Input } from '@ohif/ui';
import RESPONSE from './PROMPT_RESPONSES';

export default function createReportDialogPrompt(uiDialogService) {
  return new Promise(function(resolve, reject) {
    let dialogId = undefined;

    const _handleClose = () => {
      // Dismiss dialog
      uiDialogService.dismiss({ id: dialogId });
      // Notify of cancel action
      resolve({ action: RESPONSE.CANCEL, value: undefined });
    };

    /**
     *
     * @param {string} param0.action - value of action performed
     * @param {string} param0.value - value from input field
     */
    const _handleFormSubmit = ({ action, value }) => {
      uiDialogService.dismiss({ id: dialogId });
      switch (action.id) {
        case 'save':
          resolve({ action: RESPONSE.CREATE_REPORT, value: value.label });
          break;
        case 'cancel':
          resolve({ action: RESPONSE.CANCEL, value: undefined });
          break;
      }
    };

    dialogId = uiDialogService.create({
      centralize: true,
      isDraggable: false,
      content: Dialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Create Report',
        value: { label: '' },
        noCloseButton: true,
        onClose: _handleClose,
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
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
              uiDialogService.dismiss({ id: dialogId });
              resolve({ action: RESPONSE.CREATE_REPORT, value: value.label });
            }
          };
          return (
            <div className="">
              <Input
                label="Enter the report name"
                labelClassName="text-white grow leading-[1.2] text-[14px]"
                autoFocus
                className="bg-black border-primary-main grow"
                type="text"
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
