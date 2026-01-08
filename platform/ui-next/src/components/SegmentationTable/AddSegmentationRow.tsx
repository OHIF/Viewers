import React from 'react';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { useSegmentationTableContext } from './contexts';

export const AddSegmentationRow: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { t } = useTranslation('SegmentationPanel');

  const {
    onSegmentationAdd,
    data,
    disableEditing,
    mode,
    disabled,
    segmentationRepresentationTypes,
  } = useSegmentationTableContext('AddSegmentationRow');

  // Check if we have at least one segmentation of the representation type for the panel this component is contained in.
  const hasRepresentationType =
    (!segmentationRepresentationTypes && data.length > 0) ||
    data.some(info => segmentationRepresentationTypes?.includes(info.representation?.type));

  if (hasRepresentationType && mode === 'collapsed') {
    return null;
  }

  if (disableEditing) {
    return null;
  }

  return (
    <div
      data-cy="addSegmentation"
      className={`group ${disabled ? 'pointer-events-none cursor-not-allowed opacity-70' : ''}`}
      onClick={() =>
        !disabled &&
        onSegmentationAdd({
          segmentationId: '',
          segmentationRepresentationType: segmentationRepresentationTypes?.[0],
        })
      }
    >
      {children}
      <div className="text-primary group-hover:bg-secondary-dark flex items-center rounded-[4px] pl-1 group-hover:cursor-pointer">
        <div className="grid h-[28px] w-[28px] place-items-center">
          {disabled ? <Icons.Info /> : <Icons.Add />}
        </div>
        <span className="text-[13px]">
          {t(disabled ? 'Segmentation not supported' : 'Add segmentation')}
        </span>
      </div>
    </div>
  );
};
