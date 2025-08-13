import React from 'react';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { useSegmentationTableContext } from './contexts';

export const AddSegmentationRow: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationTable');

  const { onSegmentationAdd, data, disableEditing, mode, disabled } =
    useSegmentationTableContext('AddSegmentationRow');

  const isEmpty = data.length === 0;

  if (!isEmpty && mode === 'collapsed') {
    return null;
  }

  if (disableEditing) {
    return null;
  }

  return (
    <div
      data-cy="addSegmentation"
      className={`group ${disabled ? 'pointer-events-none cursor-not-allowed opacity-70' : ''}`}
      onClick={() => !disabled && onSegmentationAdd('')}
    >
      {children}
      <div className="text-primary group-hover:bg-secondary-dark flex items-center rounded-[4px] pl-1 group-hover:cursor-pointer">
        <div className="grid h-[28px] w-[28px] place-items-center">
          {disabled ? <Icons.Info /> : <Icons.Add />}
        </div>
        <span className="text-[13px]">
          {t(`${disabled ? 'Segmentation Not Supported' : 'Add Segmentation'}`)}
        </span>
      </div>
    </div>
  );
};
