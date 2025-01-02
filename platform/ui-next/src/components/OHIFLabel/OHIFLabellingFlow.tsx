// File: /ui-next/src/components/OHIFLabel/OHIFLabellingFlow.tsx
import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Input } from '@ohif/ui-next';
import SelectTree from './SelectTree';

function OHIFLabellingFlow({ labellingDoneCallback, measurementData, labelData, exclusive }) {
  const [open, setOpen] = useState(true);
  const [label, setLabel] = useState(measurementData?.label || '');

  const handleClose = () => {
    setOpen(false);
    labellingDoneCallback('');
  };

  const handleSelect = (_evt, itemSelected) => {
    labellingDoneCallback(itemSelected.value);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      {/* The "anchor" or trigger could be hidden */}
      <PopoverTrigger asChild>
        <Button className="hidden" />
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <SelectTree
          items={labelData || []}
          columns={1}
          onSelected={handleSelect}
          closePopup={handleClose}
          label={label}
          exclusive={exclusive}
        />
        {/* Additional Input or Buttons if needed */}
      </PopoverContent>
    </Popover>
  );
}

export default OHIFLabellingFlow;
