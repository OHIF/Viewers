import React, { useState } from 'react';
import ItemListWithProperties from './ItemListWithProperties';
import PropertiesPanel from './PropertiesPanel';
import { Item } from './types';

const PanelSplit: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Sample data; replace with actual data or fetch from API
  const items: Item[] = [
    {
      id: 1,
      name: 'List item 1',
      properties: {
        color: 'Red',
        size: 'Large',
        shape: 'Circle',
      },
    },
    {
      id: 2,
      name: 'List item 2',
      properties: {
        color: 'Blue',
        size: 'Medium',
        shape: 'Square',
      },
    },
    {
      id: 3,
      name: 'List item 3',
      properties: {
        color: 'Green',
        size: 'Small',
        shape: 'Triangle',
      },
    },
    // Add more items as needed
  ];

  return (
    <div className="flex w-[252px] flex-col">
      {/* Top Half: List of Selectable Items */}
      <div className="bg-muted h-[130px] overflow-y-auto border-b p-4">
        <ItemListWithProperties
          items={items}
          onSelectItem={setSelectedItem}
          selectedItem={selectedItem}
        />
      </div>

      {/* Bottom Half: Properties of Selected Item */}
      <div className="bg-popover h-[150px] overflow-y-auto p-4">
        <PropertiesPanel selectedItem={selectedItem} />
      </div>
    </div>
  );
};

export default PanelSplit;
