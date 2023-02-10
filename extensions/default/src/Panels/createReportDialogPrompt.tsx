/* eslint-disable react/display-name */
import React from 'react';
import { Dialog, Input, Select } from '@ohif/ui';

export const CREATE_REPORT_DIALOG_RESPONSE = {
  CANCEL: 0,
  CREATE_REPORT: 1,
};

export default function createReportDialogPrompt(
  uiDialogService,
  { extensionManager }
) {
  return new Promise(function (resolve, reject) {
    let dialogId = undefined;

    const _handleClose = () => {
      // Dismiss dialog
      uiDialogService.dismiss({ id: dialogId });
      // Notify of cancel action
      resolve({
        action: CREATE_REPORT_DIALOG_RESPONSE.CANCEL,
        value: undefined,
        dataSourceName: undefined,
      });
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
          resolve({
            action: CREATE_REPORT_DIALOG_RESPONSE.CREATE_REPORT,
            value: value.label,
            dataSourceName: value.dataSourceName,
          });
          break;
        case 'cancel':
          resolve({
            action: CREATE_REPORT_DIALOG_RESPONSE.CANCEL,
            value: undefined,
            dataSourceName: undefined,
          });
          break;
      }
    };

    const dataSourcesOpts = Object.keys(extensionManager.dataSourceMap)
      .filter(ds => {
        const configuration =
          extensionManager.dataSourceDefs[ds]?.configuration;
        const supportsStow =
          configuration?.supportsStow ?? configuration?.wadoRoot;
        return supportsStow;
      })
      .map(ds => {
        return {
          value: ds,
          label: ds,
          placeHolder: ds,
        };
      });

    dialogId = uiDialogService.create({
      centralize: true,
      isDraggable: false,
      content: Dialog,
      useLastPosition: false,
      showOverlay: true,
      contentProps: {
        title: 'Provide a name for your report',
        value: {
          label: '',
          dataSourceName: extensionManager.activeDataSource,
        },
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
              resolve({
                action: CREATE_REPORT_DIALOG_RESPONSE.CREATE_REPORT,
                value: value.label,
              });
            }
          };
          return (
            <>
              <div className="p-4 bg-primary-dark">
                {dataSourcesOpts.length > 1 && (
                  <Select
                    closeMenuOnSelect={true}
                    className="mr-2 bg-black border-primary-main"
                    options={dataSourcesOpts}
                    placeholder={
                      dataSourcesOpts.find(
                        option => option.value === value.dataSourceName
                      ).placeHolder
                    }
                    value={value.dataSourceName}
                    onChange={evt => {
                      setValue(v => ({ ...v, dataSourceName: evt.value }));
                    }}
                    isClearable={false}
                  />
                )}
              </div>
              <div className="p-4 bg-primary-dark">
                <Input
                  autoFocus
                  className="mt-2 bg-black border-primary-main"
                  type="text"
                  placeholder="Enter Report Name"
                  containerClassName="mr-2"
                  value={value.label}
                  onChange={onChangeHandler}
                  onKeyPress={onKeyPressHandler}
                  required
                />
              </div>
            </>
          );
        },
      },
    });
  });
}
