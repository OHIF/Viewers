import React from 'react';
import { Slider } from '../../../../ui-next/src/components/Slider';
import ShowcaseRow from './ShowcaseRow';

/**
 * SliderShowcase component displays Slider variants and examples
 */
export default function SliderShowcase() {
  return (
    <ShowcaseRow
      title="Slider"
      description="Used to select a value in a predefined range."
      code={`
<div className="w-40 px-5">
  <Slider
    className="w-full"
    defaultValue={[50]}
    max={100}
    step={1}
  />
</div>
      `}
    >
      <div className="w-40 px-5">
        <Slider
          className="w-full"
          defaultValue={[50]}
          max={100}
          step={1}
        />
      </div>
    </ShowcaseRow>
  );
}
