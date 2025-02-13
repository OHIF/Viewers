import React from 'react';
import { Input, Dialog, ButtonEnums, LabellingFlow } from '@ohif/ui';

/**
 *
 * @param {*} data
 * @param {*} data.text
 * @param {*} data.label
 * @param {*} event
 * @param {*} callback
 * @param {*} isArrowAnnotateInputDialog
 * @param {*} dialogConfig
 * @param {string?} dialogConfig.dialogTitle - title of the input dialog
 * @param {string?} dialogConfig.inputLabel - show label above the input
 */

export function callInputDialog(
  uiDialogService,
  data,
  callback,
  isArrowAnnotateInputDialog = true,
  dialogConfig: any = {}
) {
  const dialogId = 'dialog-enter-annotation';
  const label = data ? (isArrowAnnotateInputDialog ? data.text : data.label) : '';
  const {
    dialogTitle = 'Annotation',
    inputLabel = 'Enter your annotation',
    validateFunc = value => true,
  } = dialogConfig;

  const onSubmitHandler = ({ action, value }) => {
    switch (action.id) {
      case 'save':
        if (typeof validateFunc === 'function' && !validateFunc(value.label)) {
          return;
        }

        callback(value.label, action.id);
        break;
      case 'cancel':
        callback('', action.id);
        break;
    }
    uiDialogService.hide(dialogId);
  };

  if (uiDialogService) {
    uiDialogService.show({
      id: dialogId,
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: dialogTitle,
        value: { label },
        noCloseButton: true,
        onClose: () => uiDialogService.hide(dialogId),
        actions: [
          { id: 'cancel', text: 'Cancel', type: ButtonEnums.type.secondary },
          { id: 'save', text: 'Save', type: ButtonEnums.type.primary },
        ],
        onSubmit: onSubmitHandler,
        body: ({ value, setValue }) => {
          return (
            <Input
              autoFocus
              className="border-primary-main bg-black"
              type="text"
              id="annotation"
              label={inputLabel}
              labelClassName="text-white text-[14px] leading-[1.2]"
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

export function callLabelAutocompleteDialog(
  uiDialogService,
  callback,
  dialogConfig,
  labelConfig,
  renderContent = LabellingFlow
) {
  const exclusive = labelConfig ? labelConfig.exclusive : false;
  const dropDownItems = labelConfig ? labelConfig.items : [];

  const { validateFunc = value => true } = dialogConfig;

  const labellingDoneCallback = value => {
    if (typeof value === 'string') {
      if (typeof validateFunc === 'function' && !validateFunc(value)) {
        return;
      }
      callback(value, 'save');
    } else {
      callback('', 'cancel');
    }
    uiDialogService.hide('select-annotation');
  };

  uiDialogService.show({
    id: 'select-annotation',
    centralize: true,
    isDraggable: false,
    showOverlay: true,
    content: renderContent,
    contentProps: {
      labellingDoneCallback: labellingDoneCallback,
      measurementData: { label: '' },
      componentClassName: {},
      labelData: dropDownItems,
      exclusive: exclusive,
    },
  });
}

export function showLabelAnnotationPopup(
  measurement,
  uiDialogService,
  labelConfig,
  renderContent = LabellingFlow
) {
  const exclusive = labelConfig ? labelConfig.exclusive : false;
  const dropDownItems = labelConfig ? labelConfig.items : [];
  return new Promise<Map<any, any>>((resolve, reject) => {
    const labellingDoneCallback = value => {
      uiDialogService.hide('select-annotation');
      if (typeof value === 'string') {
        measurement.label = value;
      }
      resolve(measurement);
    };

    uiDialogService.show({
      id: 'select-annotation',
      content: renderContent,
      contentProps: {
        labellingDoneCallback: labellingDoneCallback,
        measurementData: measurement,
        componentClassName: {},
        labelData: dropDownItems,
        exclusive: exclusive,
      },
    });
  });
}

export default callInputDialog;
