import React from 'react';
import { Button, Icons} from '@ohif/ui-next';


/**
 * RepresentationList Component
s*
 * Displays a list of items that can be selected, toggled for visibility,
 * and added (changing availability).
 *
 * @param items - Array of items to display.
 * @param onSelectItem - Callback when an item is selected.
 * @param selectedItem - The currently selected item.
 * @param onToggleVisibility - Callback when an item's visibility is toggled.
 * @param onAddItem - Callback when an item's availability is changed to 'loaded'.
 */
const RepresentationList: React.FC = ({
  representations,

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
                <Icons.Plus />
              </Button>
            )}

            {/* All items are now rendered as clickable rows */}
            <button
              onClick={() => onSelectItem(item)}
              className={`text-foreground flex h-7 w-full flex-grow cursor-pointer items-center justify-between rounded p-1 text-sm ${
                item.id === selectedItem?.id ? 'bg-primary/20' : 'bg-muted hover:bg-primary/30'
              } focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1`}
              aria-pressed={item.id === selectedItem?.id}
            >
              <span className="ml-1">{item.name}</span>

              {/* Conditionally render the "Available" label for 'available' items */}
              {item.availability === 'available' && (
                <span className="text-muted-foreground text-xs">Available</span>
              )}

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
                      <Icons.EyeVisible />
                  ) : (
                    <Icons.EyeHidden />
                  )}
                </Button>
              )}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export {RepresentationList};
