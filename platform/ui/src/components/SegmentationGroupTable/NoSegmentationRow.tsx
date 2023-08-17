import React from 'react';
import Icon from '../Icon';

function NoSegmentationRow({ onSegmentationAdd }) {
  return (
    <div className="group" onClick={onSegmentationAdd}>
      <div className="text-primary-active flex group-hover:bg-secondary-dark group-hover:cursor-pointer items-center">
        <div className="w-[28px] h-[28px] grid place-items-center">
          <Icon name="icon-add" />
        </div>
        <span className="text-[13px]">Add Segmentation</span>
      </div>
    </div>
  );
}

export default NoSegmentationRow;
