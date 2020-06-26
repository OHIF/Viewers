import React, { useEffect, useState } from 'react';
import {
  LayoutSelector as OHIFLayoutSelector,
  ToolbarButton,
  useViewportGrid,
} from '@ohif/ui';

const DEFAULT_LAYOUT = {
  type: 'SET_LAYOUT',
  payload: {
    numCols: 1,
    numRows: 1,
  },
};

function LayoutSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewportGridState, viewportGridService] = useViewportGrid();

  const closeOnOutsideClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener('click', closeOnOutsideClick);
    return () => {
      window.removeEventListener('click', closeOnOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    /* Reset to default layout when component unmounts */
    return () => {
      dispatch(DEFAULT_LAYOUT);
    };
  }, []);

  const onClickHandler = () => setIsOpen(!isOpen);

  const DropdownContent = isOpen ? OHIFLayoutSelector : null;

  return (
    <ToolbarButton
      id="Layout"
      label="Grid Layout"
      icon="tool-layout"
      onClick={onClickHandler}
      dropdownContent={
        DropdownContent !== null && (
          <DropdownContent
            onSelection={({ numRows, numCols }) => {
              viewportGridService.setLayout({ numCols, numRows });
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
