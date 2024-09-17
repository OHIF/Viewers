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
      className="space-y-1"
    >
      {items.map(item => (
        <li key={item.id}>
          <button
            onClick={() => onSelectItem(item)}
            className={`text-foreground flex h-7 w-full cursor-pointer items-center justify-between rounded p-3 text-sm ${
              item.id === selectedItem?.id ? 'bg-primary/20' : 'bg-muted hover:bg-primary/30'
            } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
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
