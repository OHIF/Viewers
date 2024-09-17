// src/components/PanelSplit/PanelSplit.tsx

import React, { useState, useEffect } from 'react';
import ItemList from './ItemList';
import PropertiesPanel from './PropertiesPanel';
import { Item } from './types';
import { ScrollArea } from '../ScrollArea'; // Importing ScrollArea

const PanelSplit: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      name: 'All Items',
      controlsAll: true, // This item controls all others
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
    {
      id: 2,
      name: 'List item 1',
      series: 'Series A',
      properties: [
        {
          key: 'opacity',
          label: 'Opacity',
          type: 'slider',
          value: 70,
          min: 1,
          max: 100,
          step: 1,
        },
        {
          key: 'outline',
          label: 'Outline',
          type: 'slider',
          value: 7,
          min: 1,
          max: 10,
          step: 1,
        },
      ],
    },
    {
      id: 3,
      name: 'List item 2',
      series: 'Series B',
      properties: [
        {
          key: 'opacity',
          label: 'Opacity',
          type: 'slider',
          value: 70,
          min: 1,
          max: 100,
          step: 1,
        },
        {
          key: 'outline',
          label: 'Outline',
          type: 'slider',
          value: 7,
          min: 1,
          max: 10,
          step: 1,
        },
      ],
    },
    // Add more items as needed
  ]);

  // Set the master item as selected by default on mount
  useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      setSelectedItem(items.find(item => item.controlsAll) || items[0]);
    }
  }, [items, selectedItem]);

  /**
   * Handles updating a property's value.
   *
   * @param itemId - The ID of the item being updated.
   * @param propertyKey - The key identifying the property.
   * @param newValue - The new value for the property.
   */
  const handleUpdateProperty = (itemId: number, propertyKey: string, newValue: any) => {
    const masterItem = items.find(item => item.controlsAll);

    if (masterItem && itemId === masterItem.id) {
      // Update the property for all items
      setItems(prevItems =>
        prevItems.map(item => ({
          ...item,
          properties: item.properties.map(prop =>
            prop.key === propertyKey ? { ...prop, value: newValue } : prop
          ),
        }))
      );

      // Also update the selectedItem if it's the master
      setSelectedItem(prevSelected =>
        prevSelected
          ? {
              ...prevSelected,
              properties: prevSelected.properties.map(prop =>
                prop.key === propertyKey ? { ...prop, value: newValue } : prop
              ),
            }
          : prevSelected
      );
    } else {
      // Update only the selected item
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? {
                ...item,
                properties: item.properties.map(prop =>
                  prop.key === propertyKey ? { ...prop, value: newValue } : prop
                ),
              }
            : item
        )
      );

      // Update selectedItem
      setSelectedItem(prevSelected =>
        prevSelected
          ? {
              ...prevSelected,
              properties: prevSelected.properties.map(prop =>
                prop.key === propertyKey ? { ...prop, value: newValue } : prop
              ),
            }
          : prevSelected
      );
    }
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
    <div className="flex h-full w-[262px] flex-col">
      {/* Top Half: List of Selectable Items */}
      <ScrollArea className="bg-muted h-[130px] border-gray-300 p-1">
        <ItemList
          items={items}
          onSelectItem={handleSelectItem}
          selectedItem={selectedItem}
        />
      </ScrollArea>

      {/* Bottom Half: Properties of Selected Item */}
      <ScrollArea className="bg-popover max-h-[400px] flex-grow overflow-auto p-1">
        <PropertiesPanel
          selectedItem={selectedItem}
          onUpdateProperty={handleUpdateProperty}
        />
      </ScrollArea>
    </div>
  );
};

export default PanelSplit;
