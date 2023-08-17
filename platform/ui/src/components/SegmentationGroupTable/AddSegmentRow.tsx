import React from 'react';
import Icon from '../Icon';

function AddSegmentRow({ onClick }) {
  return (
    <div className="flex hover:cursor-pointer" onClick={onClick}>
      <div className="w-[28px] h-[28px]"></div>
      <div className="group ml-1 mt-1">
        <div className="text-primary-active flex group-hover:bg-secondary-dark items-center rounded-sm pr-2">
          <div className="w-[28px] h-[28px] grid place-items-center">
            <Icon name="icon-add" />
          </div>
          <span className="text-[13px]">Add Segment</span>
        </div>
      </div>
    </div>
  );
}

export default AddSegmentRow;
