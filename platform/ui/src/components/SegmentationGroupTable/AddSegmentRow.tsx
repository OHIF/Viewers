import React from 'react';
import Icon from '../Icon';
import { Button } from '@ohif/ui';
function AddSegmentRow({ onClick }) {
  return (
    <div>
      <div className="h-[28px] w-[28px]"></div>
      <div className="group ml-2.5 mt-1">
        <div className="text-primary-active group-hover:bg-secondary-dark flex items-center rounded-[4px] pr-2">
          <Button
            className="text-primary-active group-hover:bg-secondary-dark flex w-full items-center rounded-[4px] pr-2"
            onClick={onClick}
          >
            + Color Segments
          </Button>
          <span className="text-[13px]"></span>
        </div>
      </div>
    </div>
  );
}

export default AddSegmentRow;
