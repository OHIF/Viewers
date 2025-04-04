import React, { ReactNode, useContext, useEffect } from 'react';
import { MenuContext } from './Menu';
import { ScrollArea } from '@ohif/ui-next';

type ItemPanelProps = {
  label?: string;
  index?: number;
  children: ReactNode;
  maxHeight?: string;
};

const ItemPanel = ({ label, index = 0, children, maxHeight = '250px' }: ItemPanelProps) => {
  const { addItemPanel, activePanelIndex } = useContext(MenuContext);

  useEffect(() => {
    addItemPanel(index, label);
  }, []);

  return (
    activePanelIndex === index && (
      <div
        style={{ maxHeight, height: '100%' }}
        className="flex flex-col overflow-hidden"
      >
        <ScrollArea
          className="h-full w-full flex-grow"
          type="always"
        >
          <div className="flex flex-col">{children}</div>
        </ScrollArea>
      </div>
    )
  );
};

export default ItemPanel;
