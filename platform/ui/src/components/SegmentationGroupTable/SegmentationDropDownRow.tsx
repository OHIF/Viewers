import React from 'react';
import { Select, Icon, Dropdown, Tooltip } from '../../components';
import { useTranslation } from 'react-i18next';

type SegmentationDropDownRowProps = {
  segmentationsInfo: AppTypes.Segmentation.SegmentationInfo[];
  activeSegmentation: Segmentation | null;
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
};

function SegmentationDropDownRow({
  segmentationsInfo = [],
  activeSegmentation,
  onActiveSegmentationChange,
  disableEditing = false,
  onToggleSegmentationVisibility,
  onSegmentationEdit,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  onSegmentationDelete,
  onSegmentationAdd,
  addSegmentationClassName,
}: SegmentationDropDownRowProps) {
  const handleChange = (option: { value: string; label: string }) => {
    onActiveSegmentationChange(option.value); // Notify the parent
  };

  const selectOptions = segmentationsInfo.map(s => ({
    value: s.id,
    label: s.label,
  }));
  const { t } = useTranslation('SegmentationTable');

  if (!activeSegmentation) {
    return null;
  }

  return (
    <div className="group mx-0.5 mt-[8px] flex items-center pb-[10px]">
      <div
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <Dropdown
          id="segmentation-dropdown"
          showDropdownIcon={false}
          alignment="left"
          itemsClassName={`text-primary-active ${addSegmentationClassName}`}
          showBorders={false}
          maxCharactersPerLine={30}
          list={[
            ...(!disableEditing
              ? [
                  {
                    title: t('Add new segmentation'),
                    onClick: () => {
                      onSegmentationAdd();
                    },
                  },
                ]
              : []),
            ...(!disableEditing
              ? [
                  {
                    title: t('Rename'),
                    onClick: () => {
                      onSegmentationEdit(activeSegmentation.id);
                    },
                  },
                ]
              : []),
            {
              title: t('Delete'),
              onClick: () => {
                onSegmentationDelete(activeSegmentation.id);
              },
            },
            ...(!disableEditing
              ? [
                  {
                    title: t('Export DICOM SEG'),
                    onClick: () => {
                      storeSegmentation(activeSegmentation.id);
                    },
                  },
                ]
              : []),
            ...[
              {
                title: t('Download DICOM SEG'),
                onClick: () => {
                  onSegmentationDownload(activeSegmentation.id);
                },
              },
              {
                title: t('Download DICOM RTSTRUCT'),
                onClick: () => {
                  onSegmentationDownloadRTSS(activeSegmentation.id);
                },
              },
            ],
          ]}
        >
          <div className="hover:bg-secondary-dark grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-[4px]">
            <Icon name="icon-more-menu"></Icon>
          </div>
        </Dropdown>
      </div>
      {selectOptions?.length && (
        <Select
          id="segmentation-select"
          isClearable={false}
          onChange={handleChange}
          components={{
            DropdownIndicator: () => (
              <Icon
                name={'chevron-down-new'}
                className="mr-2"
              />
            ),
          }}
          isSearchable={false}
          options={selectOptions}
          value={selectOptions?.find(o => o.value === activeSegmentation.id)}
          className="text-aqua-pale h-[26px] w-1/2 text-[13px]"
        />
      )}
      <div className="flex items-center">
        <Tooltip
          position="bottom-right"
          content={
            <div className="flex flex-col">
              <div className="text-[13px] text-white">Series:</div>
              <div className="text-aqua-pale text-[13px]">{activeSegmentation.description}</div>
            </div>
          }
        >
          <Icon
            name="info-action"
            className="text-primary-active"
          />
        </Tooltip>
        <div
          className="hover:bg-secondary-dark mr-1 grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-[4px]"
          onClick={() => onToggleSegmentationVisibility(activeSegmentation.id)}
        >
          {activeSegmentation.isVisible ? (
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
    </div>
  );
}

export default SegmentationDropDownRow;
