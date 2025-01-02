// EARLY DRAFT WITH NEW COMPONENTS

import React, { useState } from 'react';
// We'll import Popover + other essentials from ui-next
import { Popover, PopoverTrigger, PopoverContent, Button, Input } from '@ohif/ui-next';

export function callInputDialog(
  uiDialogService,
  data,
  callback,
  isArrowAnnotateInputDialog = true,
  dialogConfig = {}
) {
  const dialogId = 'popover-label-annotation';
  const label = data ? (isArrowAnnotateInputDialog ? data.text : data.label) : '';
  const {
    dialogTitle = 'Annotation',
    inputLabel = 'Enter your annotation',
    validateFunc = val => true,
  } = dialogConfig;

  // Instead of creating a modal, we create a component that uses Popover
  // and pass it to uiDialogService (or render it directly in your UI).
  const PopoverLabelPrompt = () => {
    const [open, setOpen] = useState(true);
    const [value, setValue] = useState(label);

    const onCancel = () => {
      callback('', 'cancel');
      setOpen(false);
      uiDialogService.dismiss({ id: dialogId });
    };

    const onSave = () => {
      if (!validateFunc(value)) {
        return;
      }
      callback(value, 'save');
      setOpen(false);
      uiDialogService.dismiss({ id: dialogId });
    };

    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        {/* A Popover usually needs a Trigger. You can hide it with a hidden button or anchor */}
        <PopoverTrigger asChild>
          <Button className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="flex w-72 flex-col gap-2">
          <div className="text-primary-light text-lg font-semibold">{dialogTitle}</div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">{inputLabel}</label>
            <Input
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onSave();
                }
              }}
            />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Now we create that popover component with uiDialogService
  if (uiDialogService) {
    uiDialogService.create({
      id: dialogId,
      centralize: false,
      isDraggable: false,
      showOverlay: false, // We might not need an overlay for a popover
      content: PopoverLabelPrompt,
      contentProps: {},
    });
  }
}
