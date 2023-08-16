import React, { useState } from 'react';
import { Select, Icon, Dropdown } from '../../components';
import PropTypes from 'prop-types';

interface Segmentation {
  id: string;
  label: string;
}

interface SegmentationDropDownRowProps {
  segmentations: Segmentation[];
  onActiveSegmentationChange: (segmentation: Segmentation) => void;
}

function SegmentationDropDownRow({
  segmentations = [],
  onActiveSegmentationChange,
  isVisible,
  onSegmentationEdit,
  onSegmentationDelete,
  onSegmentationAdd,
}: SegmentationDropDownRowProps) {
  const [
    activeSegmentation,
    setActiveSegmentation,
  ] = useState<Segmentation | null>(segmentations[0]);

  const handleChange = value => {
    setActiveSegmentation(value);
    onActiveSegmentationChange(value); // Notify the parent
  };

  return (
    <div className="flex items-center mt-[8px] space-x-1 group">
      <div
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <Dropdown
          id="segmentation-dropdown"
          showDropdownIcon={false}
          alignment="left"
          itemsClassName="text-primary-active"
          showBorders={false}
          list={[
            {
              title: 'Rename',
              onClick: () => {
                onSegmentationEdit(activeSegmentation);
              },
            },
            {
              title: 'Add New Segmentation',
              onClick: () => {
                onSegmentationAdd();
              },
            },
            {
              title: 'Delete',
              onClick: () => {
                onSegmentationDelete(activeSegmentation);
              },
            },
          ]}
        >
          <Icon
            name="tool-more-menu"
            className="w-[28px] h-[28px] grid place-items-center hover:bg-primary-dark cursor-pointer text-primary-active rounded-[4px]"
          ></Icon>
        </Dropdown>
      </div>
      <Select
        id="segmentation-select"
        isClearable={false}
        onChange={handleChange}
        isSearchable={false}
        options={segmentations.map(s => ({
          value: s.id,
          label: s.label,
        }))}
        value={activeSegmentation}
        className="text-aqua-pale h-[26px] w-1/2"
      />
      <div className="items-center flex">
        <div className="w-[28px] h-[28px] rounded-[4px] grid place-items-center  hover:bg-primary-dark cursor-pointer">
          {isVisible ? (
            <Icon name="row-show-all" />
          ) : (
            <Icon name="row-hide-all" />
          )}
        </div>
      </div>
    </div>
  );
}

SegmentationDropDownRow.propTypes = {
  segmentations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onActiveSegmentationChange: PropTypes.func.isRequired,
};

export default SegmentationDropDownRow;
