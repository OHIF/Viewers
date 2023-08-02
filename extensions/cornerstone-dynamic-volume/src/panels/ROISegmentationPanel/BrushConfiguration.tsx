import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Label, Select, InputRange } from '@ohif/ui';

function BrushConfiguration({
  brushThresholdOptions,
  brushThresholdId,
  brushSize,
  onBrushThresholdChange,
  onBrushSizeChange,
}: {
  brushThresholdOptions: {
    value: string;
    label: string;
    placeHolder: string;
  };
  brushThresholdId: string;
  brushSize: number;
  onBrushThresholdChange: (thresholdId: string) => void;
  onBrushSizeChange: (brushSize: number) => void;
}): ReactElement {
  return (
    <div className="flex flex-col px-4 py-2 space-y-4 bg-primary-dark text-white">
      <div>Threshold</div>
      <div className="pb-2">
        <Select
          label="Brush Threshold"
          closeMenuOnSelect={true}
          className="mr-2 bg-black border-primary-main text-white "
          options={brushThresholdOptions}
          placeholder={
            brushThresholdOptions.find(
              option => option.value === brushThresholdId
            ).placeHolder
          }
          value={brushThresholdId}
          onChange={({ value }) => onBrushThresholdChange(value)}
        />
      </div>
      <div>
        <Label className="text-white">Brush Size</Label>
        <InputRange
          minValue={5}
          maxValue={50}
          value={brushSize}
          step={1}
          unit=""
          showLabel={true}
          onChange={brushSize => onBrushSizeChange(brushSize)}
          inputClassName="w-full"
        />
      </div>
    </div>
  );
}

BrushConfiguration.propTypes = {
  brushThresholdOptions: PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeHolder: PropTypes.string.isRequired,
  }).isRequired,
  brushThresholdId: PropTypes.string.isRequired,
  brushSize: PropTypes.number.isRequired,
  onBrushThresholdChange: PropTypes.func.isRequired,
  onBrushSizeChange: PropTypes.func.isRequired,
};

export { BrushConfiguration as default };
