// src/components/PanelSplit/ItemList.tsx

import React from 'react';
import { Item } from './types';
import { Label } from '../Label';

interface ItemListProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  selectedItem: Item | null;
}

/**
 * ItemList Component
 *
 * Displays a list of items that can be selected.
 *
 * @param items - Array of items to display.
 * @param onSelectItem - Callback when an item is selected.
 * @param selectedItem - The currently selected item.
 */
const ItemList: React.FC<ItemListProps> = ({ items, onSelectItem, selectedItem }) => {
  return (
    <ul
      aria-label="Item List"
      className="space-y-2"
    >
      {items.map(item => (
        <li key={item.id}>
          <button
            onClick={() => onSelectItem(item)}
            className={`flex w-full cursor-pointer items-center justify-between rounded-md border p-3 ${
              item.id === selectedItem?.id
                ? 'border-blue-300 bg-blue-100'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-pressed={item.id === selectedItem?.id}
          >
            <span>{item.name}</span>
            {/* Optional: Indicate if the item controls all */}
            {item.controlsAll && <span className="text-xs text-gray-600">All Items</span>}
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ItemList;
