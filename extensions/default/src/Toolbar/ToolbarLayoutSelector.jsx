import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LayoutSelector as OHIFLayoutSelector,
  ToolbarButton,
  useViewportGrid,
} from '@ohif/ui';

function LayoutSelector({ onSelection }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewportGridState, dispatch] = useViewportGrid();

  useEffect(() => {
    function LayoutSelector() {
      if (isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('click', LayoutSelector);
    return () => {
      window.removeEventListener('click', LayoutSelector);
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
      }
      isActive={isOpen}
      type="primary"
    />
  );
}

LayoutSelector.propTypes = {
  /* Callback for grid selection */
  onSelection: PropTypes.func.isRequired,
};

LayoutSelector.defaultProps = {
  onSelection: () => {
    console.warn('layoutSelector missing `onSelection` prop');
  },
};

export default LayoutSelector;
