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
 * Shows an input dialog for entering text with customizable options
 * @param uiDialogService - Service for showing UI dialogs
 * @param onSave - Callback function called when save button is clicked with entered value
 * @param defaultValue - Initial value to show in input field
 * @param title - Title text to show in dialog header
 * @param placeholder - Placeholder text for input field
 * @param submitOnEnter - Whether to submit dialog when Enter key is pressed
 */
export async function callInputDialog({
  uiDialogService,
  defaultValue = '',
  title = 'Annotation',
  placeholder = '',
  submitOnEnter = true,
}) {
  const dialogId = 'dialog-enter-annotation';

  const value = await new Promise<string>(resolve => {
    uiDialogService.show({
      id: dialogId,
      content: InputDialogDefault,
      title: title,
      contentProps: {
        onSave: value => {
          resolve(value);
        },
        placeholder,
        defaultValue,
        submitOnEnter,
      },
    });
  });

  return value;
}

export async function callInputDialogAutoComplete({
  measurement,
  uiDialogService,
  labelConfig,
  renderContent = LabellingFlow,
}) {
  const exclusive = labelConfig ? labelConfig.exclusive : false;
  const dropDownItems = labelConfig ? labelConfig.items : [];

  const value = await new Promise<Map<string, string>>((resolve, reject) => {
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

  return value;
}

export default callInputDialog;
