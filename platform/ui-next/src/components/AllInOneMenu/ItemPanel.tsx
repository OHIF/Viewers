import React, { ReactNode, useContext, useEffect } from 'react';
import { MenuContext } from './Menu';
import { ScrollArea } from '../ScrollArea/ScrollArea';

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
        <div style={{ height: '400px', background: 'rgba(255,0,0,0.2)' }}>
          <ScrollArea
            className="h-full w-full flex-grow"
            type="always"
          >
            <div className="flex flex-col">{children}</div>
          </ScrollArea>
        </div>
      </div>
    )
  );
};

export default ItemPanel;
