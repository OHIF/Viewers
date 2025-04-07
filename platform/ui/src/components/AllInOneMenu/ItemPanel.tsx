import React, { ReactNode, useContext, useEffect } from 'react';
import { ScrollArea } from '@ohif/ui-next';
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
      <ScrollArea
        style={{ scrollbarGutter: 'auto' }}
        className="flex flex-col"
      >
        {children}
      </ScrollArea>
    )
  );
};

export default ItemPanel;