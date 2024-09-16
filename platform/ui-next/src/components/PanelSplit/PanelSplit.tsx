import React, { useState } from 'react';
import ItemList from './ItemList';
import PropertiesPanel from './PropertiesPanel';
import { Item } from './types';

const PanelSplit: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const items: Item[] = [
    {
      id: 1,
      name: 'List item 1',
      properties: [
        {
          key: 'opacity',
          label: 'Opacity',
          type: 'slider',
          value: 50,
          min: 1,
          max: 100,
          step: 1,
        },
        {
          key: 'outline',
          label: 'Outline',
          type: 'slider',
          value: 5,
          min: 1,
          max: 10,
          step: 1,
        },
        {
          key: 'displayInactiveSegments',
          label: 'Display inactive segments',
          type: 'boolean',
          value: false,
        },
      ],
    },
    // Add more items as needed
  ];

  /**
   * Handles updating a property's value.
   *
   * @param itemId - The ID of the item being updated.
   * @param propertyKey - The key identifying the property.
   * @param newValue - The new value for the property.
   */
  const handleUpdateProperty = (itemId: number, propertyKey: string, newValue: any) => {
    // Update logic here (e.g., update state or make API calls)
    setSelectedItem(prevItem => {
      if (!prevItem || prevItem.id !== itemId) {
        return prevItem;
      }

      const updatedProperties = prevItem.properties.map(prop => {
        if (prop.key === propertyKey) {
          return { ...prop, value: newValue };
        }
        return prop;
      });

      return { ...prevItem, properties: updatedProperties };
    });

    // Optionally, update the items array or perform other side effects
  };

  /**
   * Handles selecting an item from the list.
   *
   * @param item - The item being selected.
   */
  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
  };

  return (
    <div className="flex w-[252px] flex-col">
      {/* Top Half: List of Selectable Items */}
      <div className="h-[130px] overflow-y-auto border-b border-gray-300 p-4">
        <ItemList
          items={items}
          onSelectItem={handleSelectItem}
          selectedItem={selectedItem}
        />
      </div>

      {/* Bottom Half: Properties of Selected Item */}
      <div className="h-[150px] overflow-y-auto bg-gray-100 p-4">
        <PropertiesPanel
          selectedItem={selectedItem}
          onUpdateProperty={handleUpdateProperty}
        />
      </div>
    </div>
  );
};

export default PanelSplit;
