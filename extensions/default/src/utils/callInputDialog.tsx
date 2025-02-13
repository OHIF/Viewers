import React from 'react';
import { LabellingFlow } from '@ohif/ui';
import { InputDialog } from '@ohif/ui-next';

interface InputDialogDefaultProps {
  hide: () => void;
  onSave: (value: string) => void;
  placeholder: string;
  defaultValue: string;
  submitOnEnter: boolean;
}

function InputDialogDefault({
  hide,
  onSave,
  placeholder = 'Enter value',
  defaultValue = '',
  submitOnEnter,
}: InputDialogDefaultProps) {
  return (
    <InputDialog
      className="min-w-[300px] max-w-md"
      submitOnEnter={submitOnEnter}
    >
      <InputDialog.Field>
        <InputDialog.Input
          placeholder={placeholder}
          defaultValue={defaultValue}
        />
      </InputDialog.Field>
      <InputDialog.Actions>
        <InputDialog.ActionsSecondary onClick={hide}>Cancel</InputDialog.ActionsSecondary>
        <InputDialog.ActionsPrimary
          onClick={value => {
            onSave(value);
            hide();
          }}
        >
          Save
        </InputDialog.ActionsPrimary>
      </InputDialog.Actions>
    </InputDialog>
  );
}

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
export function callInputDialog({
  uiDialogService,
  onSave,
  defaultValue = '',
  title = 'Annotation',
  placeholder = '',
  submitOnEnter = true,
}) {
  const dialogId = 'dialog-enter-annotation';

  uiDialogService.show({
    id: dialogId,
    content: InputDialogDefault,
    title: title,
    contentProps: {
      onSave,
      placeholder,
      defaultValue,
      submitOnEnter,
    },
  });
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
