import React from 'react';
import Icon from '../Icon';

function NoSegmentationRow({ onSegmentationAdd }) {
  return (
    <div
      className="group"
      onClick={onSegmentationAdd}
    >
      <div className="text-primary-active group-hover:bg-secondary-dark flex items-center rounded-[4px] group-hover:cursor-pointer">
        <div className="grid h-[28px] w-[28px] place-items-center">
          <Icon name="icon-add" />
        </div>
        <span className="text-[13px]">Add Segmentation</span>
      </div>
    </div>
  );
}

export default NoSegmentationRow;
