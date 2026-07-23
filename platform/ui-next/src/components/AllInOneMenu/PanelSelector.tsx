import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../Tabs';

type PanelSelectorProps = {
  panelLabels: Array<ReactNode>;
  onActiveIndexChange: (index: number) => void;
  activeIndex: number;
};

const PanelSelector = ({ panelLabels, onActiveIndexChange, activeIndex }: PanelSelectorProps) => {
  return (
    <div className="mx-2 my-1 flex justify-center">
      <Tabs
        value={String(activeIndex)}
        onValueChange={val => onActiveIndexChange(parseInt(val, 10))}
      >
        <TabsList>
          {panelLabels.map((panelLabel, index) => (
            <TabsTrigger
              key={index}
              value={String(index)}
            >
              {panelLabel}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default PanelSelector;
