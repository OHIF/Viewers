import React, { ReactNode, useContext, useEffect } from 'react';
import { MenuContext } from './Menu';

type ItemPanelProps = {
  label?: string;
  index?: number;
  children: ReactNode;
};

const ItemPanel = ({ label, index = 0, children }: ItemPanelProps) => {
  const { addItemPanel, activePanelIndex } = useContext(MenuContext);

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

export default ItemPanel;
