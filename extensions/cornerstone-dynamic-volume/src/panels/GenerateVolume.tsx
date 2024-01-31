import React from 'react';
import { InputDoubleRange } from '@ohif/ui';
import { Select } from '@ohif/ui';
import { Button } from '@ohif/ui';
import PropTypes from 'prop-types';

const GenerateVolume = ({
  rangeValues,
  handleSliderChange,
  operationsUI,
  options,
  handleGenerateOptionsChange,
  onGenerateImage,
  returnTo4D,
  displayingComputedVolume,
}) => {
  return (
    <>
      <div>
        <div className="mb-2 text-white">Computed Image</div>
        <Select
          closeMenuOnSelect={true}
          className="border-primary-main mr-2 bg-black text-white "
          options={operationsUI}
          placeholder={operationsUI.find(option => option.value === options.Operation).placeHolder}
          value={options.Operation}
          onChange={({ value }) => {
            handleGenerateOptionsChange({
              Operation: value,
            });
          }}
        />
        <InputDoubleRange
          values={rangeValues}
          onChange={handleSliderChange}
          minValue={rangeValues[0] || 1}
          maxValue={rangeValues[1] || 2}
          showLabel={true}
          step={1}
        />
        <div className="flex space-x-2">
          <Button
            onClick={onGenerateImage}
            className="w-1/2"
          >
            Generate
          </Button>
          <Button
            onClick={returnTo4D}
            disabled={!displayingComputedVolume}
            className="w-1/2"
          >
            Return To 4D
          </Button>
        </div>
      </div>
    </>
  );
};

GenerateVolume.propTypes = {
  rangeValues: PropTypes.array.isRequired,
  handleSliderChange: PropTypes.func.isRequired,
  operationsUI: PropTypes.array.isRequired,
  options: PropTypes.object.isRequired,
  handleGenerateOptionsChange: PropTypes.func.isRequired,
  onGenerateImage: PropTypes.func.isRequired,
  returnTo4D: PropTypes.func.isRequired,
};

export default GenerateVolume;
