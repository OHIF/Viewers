import React, { useEffect, useState } from 'react';
import {
  LayoutSelector as OHIFLayoutSelector,
  ToolbarButton,
  useViewportGrid,
} from '@ohif/ui';

function LayoutSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewportGridState, dispatch] = useViewportGrid();

  useEffect(() => {
    function closeOnOutsideClick() {
      if (isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('click', closeOnOutsideClick);
    return () => {
      window.removeEventListener('click', closeOnOutsideClick);
    };
  }, [isOpen]);

  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  return (
    <ToolbarButton
      id="Layout"
      label="Grid Layout"
      icon="tool-layout"
      onClick={() => {
        setIsOpen(!isOpen);
      }}
      dropdownContent={
        DropdownContent !== null && (
          <DropdownContent
            onSelection={({ numRows, numCols }) => {
              dispatch({
                type: 'SET_LAYOUT',
                payload: {
                  numCols,
                  numRows,
                },
              });
            }}
          />
        )
      }
      isActive={isOpen}
      type="primary"
    />
  );
}

export default LayoutSelector;
