import React from 'react';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { useSegmentationTableContext } from './SegmentationTableContext';

export const AddSegmentationRow: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationTable');

  const { onSegmentationAdd, data, disableEditing, mode } =
    useSegmentationTableContext('SegmentationTable');

  const isEmpty = data.length === 0;

  if (!isEmpty && mode === 'collapsed') {
    return null;
  }

  if (disableEditing) {
    return null;
  }

  return (
    <div
      className={`group`}
      onClick={() => onSegmentationAdd('')}
    >
      {children}
      <div className="text-primary-active group-hover:bg-secondary-dark flex items-center rounded-[4px] pl-1 group-hover:cursor-pointer">
        <div className="grid h-[28px] w-[28px] place-items-center">
          <Icons.Add />
        </div>
        <span className="text-[13px]">{t('Add Segmentation')}</span>
      </div>
    </div>
  );
};
