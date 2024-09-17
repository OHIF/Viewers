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
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
            >
              <g
                id="hide"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <rect
                  id="Rectangle"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                ></rect>
                <circle
                  id="Oval"
                  stroke="#348CFD"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  cx="12.4986195"
                  cy="11.8041442"
                  r="2.58684689"
                ></circle>
                <path
                  d="M20.906611,11.5617197 C20.0470387,10.5861089 16.6094888,7 12.4986195,7 C8.38775024,7 4.95020027,10.5861089 4.090628,11.5617197 C3.96979067,11.7007491 3.96979067,11.9075393 4.090628,12.0465687 C4.95020027,13.0221796 8.38775024,16.6082885 12.4986195,16.6082885 C16.6094888,16.6082885 20.0470387,13.0221796 20.906611,12.0465687 C21.0274483,11.9075393 21.0274483,11.7007491 20.906611,11.5617197 Z"
                  id="Path"
                  stroke="#348CFD"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ItemList;
