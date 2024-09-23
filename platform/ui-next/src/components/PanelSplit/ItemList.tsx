// src/components/PanelSplit/ItemList.tsx

import React from 'react';
import { Item, VisibilityState, AvailabilityState } from './types';
import { Button } from '../Button';

interface ItemListProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  selectedItem: Item | null;
  onToggleVisibility: (itemId: number) => void; // Prop for visibility toggle
  onAddItem: (itemId: number) => void; // Prop for add button
}

/**
 * ItemList Component
 *
 * Displays a list of items that can be selected, toggled for visibility,
 * and added (changing availability).
 *
 * @param items - Array of items to display.
 * @param onSelectItem - Callback when an item is selected.
 * @param selectedItem - The currently selected item.
 * @param onToggleVisibility - Callback when an item's visibility is toggled.
 * @param onAddItem - Callback when an item's availability is changed to 'loaded'.
 */
const ItemList: React.FC<ItemListProps> = ({
  items,
  onSelectItem,
  selectedItem,
  onToggleVisibility,
  onAddItem,
}) => {
  return (
    <ul
      aria-label="Item List"
      className="space-y-1"
    >
      {items.map(item => (
        <li key={item.id}>
          <div className="flex items-center">
            {/* Conditionally render the Add button for 'available' items */}
            {item.availability === 'available' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={e => {
                  e.stopPropagation(); // Prevent parent onClick
                  onAddItem(item.id);
                }}
                aria-label={`Add ${item.name}`}
                className="ml-1 mr-1"
              >
                {/* Plus Icon */}
                <svg
                  width="16px"
                  height="16px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19"
                    stroke="#348CFD"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 12H19"
                    stroke="#348CFD"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            )}

            {/* Conditional Rendering Based on Availability */}
            {item.availability === 'available' ? (
              // Non-clickable row for 'available' items
              <div
                className={`text-foreground flex h-7 w-full flex-grow items-center justify-between rounded p-1 text-sm ${
                  item.id === selectedItem?.id ? 'bg-primary/20' : 'bg-muted'
                } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
              >
                <span>{item.name}</span>
                <span className="text-muted-foreground ml-2 mr-2 text-xs">Available</span>
              </div>
            ) : (
              // Clickable button for 'loaded' and 'not available' items
              <button
                onClick={() => onSelectItem(item)}
                className={`text-foreground flex h-7 w-full flex-grow cursor-pointer items-center justify-between rounded p-3 text-sm ${
                  item.id === selectedItem?.id ? 'bg-primary/20' : 'bg-muted hover:bg-primary/30'
                } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
                aria-pressed={item.id === selectedItem?.id}
              >
                <span>{item.name}</span>

                {/* Conditionally render the visibility icon for 'loaded' items */}
                {item.availability === 'loaded' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation(); // Prevent parent onClick
                      onToggleVisibility(item.id);
                    }}
                    aria-label={
                      item.visibility === 'Visible' ? `Hide ${item.name}` : `Show ${item.name}`
                    }
                  >
                    {item.visibility === 'Visible' ? (
                      // SVG Icon for "Visible"
                      <svg
                        width="24px"
                        height="24px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          stroke="none"
                          strokeWidth="1"
                          fill="none"
                          fillRule="evenodd"
                        >
                          <rect
                            x="0"
                            y="0"
                            width="24"
                            height="24"
                          ></rect>
                          <circle
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            cx="12.4986195"
                            cy="11.8041442"
                            r="2.58684689"
                          ></circle>
                          <path
                            d="M20.906611,11.5617197 C20.0470387,10.5861089 16.6094888,7 12.4986195,7
                               C8.38775024,7 4.95020027,10.5861089 4.090628,11.5617197
                               C3.96979067,11.7007491 3.96979067,11.9075393 4.090628,12.0465687
                               C4.95020027,13.0221796 8.38775024,16.6082885 12.4986195,16.6082885
                               C16.6094888,16.6082885 20.0470387,13.0221796 20.906611,12.0465687
                               C21.0274483,11.9075393 21.0274483,11.7007491 20.906611,11.5617197 Z"
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </g>
                      </svg>
                    ) : (
                      // SVG Icon for "Hidden"
                      <svg
                        width="24px"
                        height="24px"
                        viewBox="0 0 24 24"
                      >
                        <g
                          stroke="none"
                          strokeWidth="1"
                          fill="none"
                          fillRule="evenodd"
                        >
                          <path
                            d="M18.0567826,8.96286957
                               C19.1471229,9.75269568 20.1356859,10.674229 21,11.7065217
                               C21,11.7065217 17.1949565,16.5108696 12.5,16.5108696
                               C11.7479876,16.5066962 11.0007435,16.3911225 10.2826087,16.167913"
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                          <path
                            d="M6.93286957,14.4413043
                               C5.84666081,13.6535964 4.86162018,12.7350857 4,11.7065217
                               C4,11.7065217 7.80504348,6.90217391 12.5,6.90217391
                               C13.1235541,6.90480509 13.7443251,6.98550531 14.3478261,7.1423913"
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                          <path
                            d="M9.54347826,11.7065217
                               C9.54347826,10.0736799 10.8671581,8.75 12.5,8.75"
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                          <path
                            d="M15.4565217,11.7065217
                               C15.4565217,13.3393636 14.1328419,14.6630435 12.5,14.6630435"
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                          <line
                            x1="19.7065217"
                            y1="4.5"
                            x2="5.29347826"
                            y2="18.9130435"
                            stroke="#348CFD"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></line>
                        </g>
                      </svg>
                    )}
                  </Button>
                )}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ItemList;
