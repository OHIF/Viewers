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
      <div className="marginBottom-10px">Frame Panel</div>
      <div className="">
        <InputDoubleRange
          values={rangeValues}
          onChange={handleSliderChange}
          minValue={rangeValues[0] || 1}
          maxValue={rangeValues[1] || 2}
          showLabel={true}
          step={1}
        />
      </div>
      <Select
        label={'Strategy'}
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
      <Button
        onClick={onGenerateImage}
        disabled={displayingComputedVolume}
      >
        Generate Image
      </Button>
      <Button
        onClick={returnTo4D}
        disabled={!displayingComputedVolume}
      >
        Return To 4D
      </Button>
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
