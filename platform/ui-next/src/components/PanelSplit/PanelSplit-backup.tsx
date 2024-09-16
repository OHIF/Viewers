import React from 'react';
import { Slider } from '../Slider';

const PanelSplit: React.FC = () => {
  return (
    <div className="flex h-[400px] w-[200px] items-center justify-center bg-blue-500">
      <p className="text-white">This is the PanelSplit component.</p>
      <Slider
        className="w-full"
        defaultValue={[50]}
        max={100}
        step={1}
      />
    </div>
  );
};

export default PanelSplit;
