import React from 'react';
import Icon from '../Icon';
import { useTranslation } from 'react-i18next';

function AddSegmentRow({ onClick, onToggleSegmentationVisibility = null, segmentation = null }) {
  const { t } = useTranslation('SegmentationTable');
  return (
    <div className="flex justify-between bg-black pl-[34px] hover:cursor-pointer">
      <div
        className="group py-[5px] pb-[5px]"
        onClick={onClick}
      >
        <div className="text-primary-active group-hover:bg-secondary-dark flex items-center rounded-[4px] pr-2">
          <div className="grid h-[28px] w-[28px] place-items-center">
            <Icon name="icon-add" />
          </div>
          <span className="text-[13px]">{t('Add segment')}</span>
        </div>
      </div>
      {segmentation && (
        <div className="flex items-center">
          <div
            className="hover:bg-secondary-dark ml-3 mr-1 grid h-[28px]  w-[28px] cursor-pointer place-items-center rounded-[4px]"
            onClick={() => onToggleSegmentationVisibility(segmentation.id)}
          >
            {segmentation.isVisible ? (
              <Icon
                name="row-shown"
                className="text-primary-active"
              />
            ) : (
              <Icon
                name="row-hidden"
                className="text-primary-active"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddSegmentRow;
