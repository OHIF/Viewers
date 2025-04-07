import React, { ReactNode, useContext, useEffect } from 'react';
import { MenuContext } from './Menu';
import { ScrollArea } from '@ohif/ui-next';

type ItemPanelProps = {
  label?: string;
  index?: number;
  children: ReactNode;
  maxHeight?: string;
  className?: string;
};

const ItemPanel = ({ label, index = 0, children, maxHeight = '250px', className }: ItemPanelProps) => {
  const { addItemPanel, activePanelIndex } = useContext(MenuContext);

  useEffect(() => {
    addItemPanel(index, label);
  }, [addItemPanel, index, label]);

  return (
    activePanelIndex === index && (
      <div
        style={{ scrollbarGutter: 'auto', maxHeight, height: '100%' }}
        className={`ohif-scrollbar flex flex-col overflow-auto ${className || ''}`}
      >
        {children}
      </div>
    )
  );
};

export default ItemPanel;