import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Label, Select, InputRange, InputNumber } from '@ohif/ui';

function BrushConfiguration({
  brushThresholdOptions,
  brushThresholdId,
  brushSize,
  showThresholdSettings,
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
  showThresholdSettings: boolean;
  onBrushThresholdChange: (thresholdId: string) => void;
  onBrushSizeChange: (brushSize: number) => void;
}): ReactElement {
  return (
    <div className="bg-primary-dark flex flex-col space-y-4 px-4 py-2 text-white">
      {showThresholdSettings && (
        <>
          <div>Threshold</div>
          <div className="pb-2">
            <Select
              label="Brush Threshold"
              closeMenuOnSelect={true}
              className="border-primary-main mr-2 bg-black text-white "
              options={brushThresholdOptions}
              placeholder={
                brushThresholdOptions.find(option => option.value === brushThresholdId).placeHolder
              }
              value={brushThresholdId}
              onChange={({ value }) => onBrushThresholdChange(value)}
            />
          </div>
        </>
      )}
      <div>
        <div className="flex space-x-4">
          <Label className="text-white">Brush Size</Label>
          <InputNumber
            value={brushSize}
            onChange={brushSize => onBrushSizeChange(brushSize)}
          />
        </div>
        <InputRange
          minValue={0.1}
          maxValue={50}
          value={brushSize}
          step={0.25}
          unit=""
          showLabel={true}
          onChange={brushSize => onBrushSizeChange(brushSize)}
          inputClassName="w-full"
        />
      </div>
    </div>
  );
}

BrushConfiguration.defaultPprops = {
  showThresholdSettings: false,
};

BrushConfiguration.propTypes = {
  brushThresholdOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      placeHolder: PropTypes.string.isRequired,
    })
  ).isRequired,
  brushThresholdId: PropTypes.string,
  brushSize: PropTypes.number.isRequired,
  showThresholdSettings: PropTypes.bool,
  onBrushThresholdChange: PropTypes.func,
  onBrushSizeChange: PropTypes.func.isRequired,
};

export { BrushConfiguration as default };
