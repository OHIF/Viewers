import React from 'react';
import { Icon, Dropdown, Tooltip } from '../../components';
import { useTranslation } from 'react-i18next';
import { Select } from '@ohif/ui-next';

type Segmentation = {
  id: string;
  label: string;
  isActive: boolean;
  isVisible: boolean;
};

interface SegmentationDropDownRowProps {
  segmentations: Segmentation[];
  onActiveSegmentationChange: (segmentationId: string) => void;
  disableEditing?: boolean;
  onToggleSegmentationVisibility: (segmentationId: string) => void;
  onSegmentationEdit: (segmentationId: string) => void;
  onSegmentationDownload: (segmentationId: string) => void;
  onSegmentationDownloadRTSS: (segmentationId: string) => void;
  storeSegmentation: (segmentationId: string) => void;
  onSegmentationDelete: (segmentationId: string) => void;
  onSegmentationAdd: () => void;
  addSegmentationClassName?: string;
}

const SegmentationDropDownRow: React.FC<SegmentationDropDownRowProps> = ({
  segmentations,
  onActiveSegmentationChange,
  disableEditing = false,
  onToggleSegmentationVisibility,
  onSegmentationEdit,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  onSegmentationDelete,
  onSegmentationAdd,
  addSegmentationClassName = '',
}) => {
  const { t } = useTranslation('SegmentationTable');

  const activeSegmentation = segmentations.find(seg => seg.isActive);
  if (!activeSegmentation) {
    return null;
  }

  const handleSelectChange = (option: { value: string; label: string }) => {
    onActiveSegmentationChange(option.value);
  };

  const selectOptions = segmentations.map(seg => ({
    value: seg.id,
    label: seg.label,
  }));

  const dropdownItems = [
    ...(!disableEditing ? [{ title: t('Add new segmentation'), onClick: onSegmentationAdd }] : []),
    ...(!disableEditing
      ? [{ title: t('Rename'), onClick: () => onSegmentationEdit(activeSegmentation.id) }]
      : []),
    { title: t('Delete'), onClick: () => onSegmentationDelete(activeSegmentation.id) },
    ...(!disableEditing
      ? [
          {
            title: t('Export DICOM SEG'),
            onClick: () => storeSegmentation(activeSegmentation.id),
          },
        ]
      : []),
    {
      title: t('Download DICOM SEG'),
      onClick: () => onSegmentationDownload(activeSegmentation.id),
    },
    {
      title: t('Download DICOM RTSTRUCT'),
      onClick: () => onSegmentationDownloadRTSS(activeSegmentation.id),
    },
  ];

  return (
    <div className="mt-2.5 flex items-center space-x-2 pb-2.5">
      <div onClick={e => e.stopPropagation()}>
        <Dropdown
          id="segmentation-dropdown"
          showDropdownIcon={false}
          alignment="left"
          itemsClassName={`text-primary-active ${addSegmentationClassName}`}
          showBorders={false}
          maxCharactersPerLine={30}
          list={dropdownItems}
        >
          <div className="hover:bg-secondary-dark grid h-7 w-7 cursor-pointer place-items-center rounded-md">
            <Icon name="icon-more-menu" />
          </div>
        </Dropdown>
      </div>

      {selectOptions.length > 0 && (
        <Select.Select
          onValueChange={value => onActiveSegmentationChange(value)}
          value={activeSegmentation.id}
        >
          <Select.SelectTrigger>
            <Select.SelectValue placeholder={t('Select a segmentation')} />
          </Select.SelectTrigger>
          <Select.SelectContent>
            {selectOptions.map(option => (
              <Select.SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </Select.SelectItem>
            ))}
          </Select.SelectContent>
        </Select.Select>
      )}

      <div className="flex items-center space-x-2">
        <Tooltip
          position="bottom-right"
          content={
            <div className="flex flex-col">
              <span className="text-sm text-white">{t('Series')}:</span>
              <span className="text-aqua-pale text-sm">{activeSegmentation.label}</span>
            </div>
          }
        >
          <Icon
            name="info-action"
            className="text-primary-active cursor-pointer"
          />
        </Tooltip>

        <div
          className="hover:bg-secondary-dark grid h-7 w-7 cursor-pointer place-items-center rounded-md"
          onClick={() => onToggleSegmentationVisibility(activeSegmentation.id)}
          aria-label={
            activeSegmentation.isVisible ? t('Hide Segmentation') : t('Show Segmentation')
          }
          role="button"
          tabIndex={0}
          onKeyPress={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              onToggleSegmentationVisibility(activeSegmentation.id);
            }
          }}
        >
          <Icon
            name={activeSegmentation.isVisible ? 'row-shown' : 'row-hidden'}
            className="text-primary-active"
          />
        </div>
      </div>
    </div>
  );
};

export default SegmentationDropDownRow;
