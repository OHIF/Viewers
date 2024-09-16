// src/components/PanelSplit/ItemList.tsx

import React from 'react';
import { Item } from './types';

interface ItemListProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  selectedItem: Item | null;
}

const ItemList: React.FC<ItemListProps> = ({ items, onSelectItem, selectedItem }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, item: Item) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onSelectItem(item);
    }
  };

  return (
    <div>
      <h2
        id="item-list-heading"
        className="mb-2 text-lg font-bold"
      >
        Available Items
      </h2>
      <ul
        aria-labelledby="item-list-heading"
        className="space-y-2"
      >
        {items.map(item => (
          <li
            key={item.id}
            onClick={() => onSelectItem(item)}
            className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${
              item.id === selectedItem?.id
                ? 'border-blue-300 bg-blue-100'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            role="button"
            tabIndex={0}
            onKeyDown={e => handleKeyDown(e, item)}
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ItemList;
