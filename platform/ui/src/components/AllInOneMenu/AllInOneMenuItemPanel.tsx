import React, { useContext, useEffect } from 'react';
import { AllInOneMenuContext } from './AllInOneMenu';

type AllInOneMenuItemPanelProps = {
  label: string;
  index?: number;
  children: unknown;
};

const AllInOneMenuItemPanel = ({ label, index = 0, children }: AllInOneMenuItemPanelProps) => {
  const { addItemPanel, activePanelIndex } = useContext(AllInOneMenuContext);

  useEffect(() => {
    addItemPanel(index, label);
  }, []);

  return (
    activePanelIndex === index && (
      <div
        style={{ scrollbarGutter: 'auto' }}
        className="ohif-scrollbar flex flex-col overflow-auto"
      >
        {children}
      </div>
    )
  );
};

export default AllInOneMenuItemPanel;
