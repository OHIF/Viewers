import React from 'react';
import Icon from '../Icon';

function AddSegmentRow({ onClick }) {
  return (
    <div
      className="flex hover:cursor-pointer"
      onClick={onClick}
    >
      <div className="h-[28px] w-[28px]"></div>
      <div className="group ml-2.5 mt-1">
        <div className="text-primary-active group-hover:bg-secondary-dark flex items-center rounded-[4px] pr-2">
          <div className="grid h-[28px] w-[28px] place-items-center">
            <Icon name="icon-add" />
          </div>
          <span className="text-[13px]">Add Segment</span>
        </div>
      </div>
    </div>
  );
}

export default AddSegmentRow;
