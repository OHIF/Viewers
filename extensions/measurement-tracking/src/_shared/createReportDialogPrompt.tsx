/* eslint-disable react/display-name */
import React from 'react';
import { ButtonEnums, Dialog, Input } from '@ohif/ui';
import RESPONSE from './PROMPT_RESPONSES';

export default function createReportDialogPrompt(uiDialogService) {
  return new Promise(function (resolve, reject) {
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
      switch (action.id) {
        case 'save':
          // Only save if description is not blank otherwise ignore
          if (value.label && value.label.trim() !== '') {
            resolve({
              action: RESPONSE.CREATE_REPORT,
              value: value.label.trim(),
            });
            uiDialogService.dismiss({ id: dialogId });
          }
          break;
        case 'cancel':
          uiDialogService.dismiss({ id: dialogId });
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
          { id: 'cancel', text: 'Cancel', type: ButtonEnums.type.secondary },
          { id: 'save', text: 'Save', type: ButtonEnums.type.primary },
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
              // Trigger form submit
              _handleFormSubmit({ action: { id: 'save' }, value });
            }
          };
          return (
            <div className="">
              <Input
                label="Enter the report name"
                labelClassName="text-white grow leading-[1.2] text-[14px]"
                autoFocus
                className="border-primary-main grow bg-black"
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
