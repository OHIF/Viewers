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

  const addSegmentation = () => {
    if (disabled) {
      return;
    }
    onSegmentationAdd({
      segmentationId: '',
      segmentationRepresentationType: segmentationRepresentationTypes?.[0],
    });
  };

  // Exposed as a button (role, tab stop, Enter/Space) so the row can be reached and
  // activated from the keyboard and is announced by screen readers.
  return (
    <div
      data-cy="addSegmentation"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={`focus-visible:ring-ring group rounded-[4px] focus-visible:outline-none focus-visible:ring-1 ${disabled ? 'pointer-events-none cursor-not-allowed opacity-70' : ''}`}
      onClick={addSegmentation}
      onKeyDown={event => {
        // Only react when the row itself has focus; keys bubbling up from focusable
        // children keep their own default behaviour.
        if (event.target !== event.currentTarget) {
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          addSegmentation();
        }
      }}
    >
      {children}
      <div className="text-primary group-hover:bg-popover group-focus-visible:bg-popover flex items-center rounded-[4px] pl-1 group-hover:cursor-pointer">
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
