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
            className={`flex w-full cursor-pointer items-center justify-between rounded-md border p-1 ${
              item.id === selectedItem?.id
                ? 'border-blue-300 bg-blue-100'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-pressed={item.id === selectedItem?.id}
          >
            <span>{item.name}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 3a1 1 0 01.993.883L11 4v12a1 1 0 01-1.993.117L9 16V4a1 1 0 011-1z" />
              <path d="M4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ItemList;
