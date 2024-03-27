import React, { ReactNode } from 'react';
import { ButtonGroup } from '../../components';

type PanelSelectorProps = {
  panelLabels: Array<ReactNode>;
  onActiveIndexChange: (index: number) => void;
  activeIndex: number;
};

const PanelSelector = ({ panelLabels, onActiveIndexChange, activeIndex }: PanelSelectorProps) => {
  const getButtons = () => {
    return panelLabels.map((panelLabel, index) => {
      return {
        children: panelLabel,
        key: index,
      };
    });
  };

  return (
    <div className="mx-2 my-1 flex justify-center">
      <ButtonGroup
        buttons={getButtons()}
        onActiveIndexChange={onActiveIndexChange}
        defaultActiveIndex={activeIndex}
      ></ButtonGroup>
    </div>
  );
};

export default PanelSelector;
