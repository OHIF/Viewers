import React, { useState } from 'react';
import { Icon, Dropdown } from '../../components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import AddSegmentRow from './AddSegmentRow';
import SegmentationGroupSegment from './SegmentationGroupSegment';
import { Tooltip } from '../../components';

function SegmentationItem({
  segmentation = {},
  disableEditing = false,
  onSegmentationEdit,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  onSegmentationDelete,
  showAddSegment,
  onToggleSegmentationVisibility,
  onSegmentAdd,
  onSegmentClick,
  onSegmentDelete,
  onSegmentEdit,
  showDeleteSegment,
  onSegmentColorClick,
  onToggleSegmentVisibility,
  onToggleSegmentLock,
  activeSegmentationId,
}) {
  const { t } = useTranslation('SegmentationTable');

  const [areChildrenVisible, setChildrenVisible] = useState(true);

  const handleHeaderClick = () => {
    setChildrenVisible(!areChildrenVisible);
  };

  return (
    <>
      <div className="bg-secondary-dark group relative flex items-center justify-start gap-1">
        <div
          onClick={e => {
            e.stopPropagation();
          }}
          className="flex"
        >
          <Dropdown
            id="segmentation-dropdown"
            showDropdownIcon={false}
            alignment="left"
            itemsClassName="text-primary-active"
            showBorders={false}
            maxCharactersPerLine={30}
            list={[
              ...(!disableEditing
                ? [
                    {
                      title: t('Rename'),
                      onClick: () => {
                        onSegmentationEdit(segmentation.id);
                      },
                    },
                  ]
                : []),
              {
                title: t('Delete'),
                onClick: () => {
                  onSegmentationDelete(segmentation.id);
                },
              },
              ...(!disableEditing
                ? [
                    {
                      title: t('Export DICOM SEG'),
                      onClick: () => {
                        storeSegmentation(segmentation.id);
                      },
                    },
                  ]
                : []),
              ...[
                {
                  title: t('Download DICOM SEG'),
                  onClick: () => {
                    onSegmentationDownload(segmentation.id);
                  },
                },
                {
                  title: t('Download DICOM RTSTRUCT'),
                  onClick: () => {
                    onSegmentationDownloadRTSS(segmentation.id);
                  },
                },
              ],
            ]}
          >
            <div className="hover:bg-secondary-dark grid h-[28px] w-[28px]  cursor-pointer place-items-center rounded-[4px]">
              <Icon name="icon-more-menu"></Icon>
            </div>
          </Dropdown>
          <div
            className=" h-[28px] bg-black"
            style={{ width: '3px' }}
          ></div>
        </div>
        <div
          className="flex h-full w-full cursor-pointer items-center justify-between pr-[8px]"
          onClick={handleHeaderClick}
        >
          <div className="font-inter text-aqua-pale text-[13px]">{segmentation.label}</div>
          <div className="flex h-[28px] items-center justify-center gap-2">
            <Tooltip
              position="bottom-right"
              content={
                <div className="flex flex-col">
                  <div className="text-[13px] text-white">Series:</div>
                  <div className="text-aqua-pale text-[13px]">{segmentation.description}</div>
                </div>
              }
            >
              <Icon
                name="info-action"
                className="text-primary-active"
              />
            </Tooltip>
            <div className={areChildrenVisible ? '' : 'mr-[4px]'}>
              <Icon name={areChildrenVisible ? 'chevron-down-new' : 'chevron-left-new'} />
            </div>
          </div>
        </div>
      </div>
      {areChildrenVisible && (
        <>
          {!disableEditing && showAddSegment && (
            <AddSegmentRow
              onClick={() => onSegmentAdd(segmentation.id)}
              onToggleSegmentationVisibility={onToggleSegmentationVisibility}
              segmentation={segmentation}
            />
          )}
          <div
            className={classNames('ohif-scrollbar flex min-h-0 flex-col overflow-y-hidden', {
              'mt-1': disableEditing || !showAddSegment,
            })}
          >
            {segmentation?.segments?.map(segment => {
              if (!segment) {
                return null;
              }

              const { segmentIndex, color, label, isVisible, isLocked, displayText } = segment;
              return (
                <div key={segmentIndex}>
                  <SegmentationGroupSegment
                    segmentationId={segmentation.id}
                    segmentIndex={segmentIndex}
                    label={label}
                    color={color}
                    isActive={
                      segmentation.activeSegmentIndex === segmentIndex &&
                      segmentation.id === activeSegmentationId
                    }
                    disableEditing={disableEditing}
                    isLocked={isLocked}
                    isVisible={isVisible}
                    onClick={onSegmentClick}
                    onEdit={onSegmentEdit}
                    onDelete={onSegmentDelete}
                    showDelete={showDeleteSegment}
                    onColor={onSegmentColorClick}
                    onToggleVisibility={onToggleSegmentVisibility}
                    onToggleLocked={onToggleSegmentLock}
                    displayText={displayText}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

SegmentationItem.propTypes = {
  segmentation: PropTypes.object,
  disableEditing: PropTypes.bool,
  onToggleSegmentationVisibility: PropTypes.func,
  onSegmentationEdit: PropTypes.func,
  onSegmentationDownload: PropTypes.func,
  onSegmentationDownloadRTSS: PropTypes.func,
  storeSegmentation: PropTypes.func,
  onSegmentationDelete: PropTypes.func,
  showAddSegment: PropTypes.bool,
  onSegmentAdd: PropTypes.func,
  onSegmentClick: PropTypes.func,
  onSegmentDelete: PropTypes.func,
  onSegmentEdit: PropTypes.func,
  showDeleteSegment: PropTypes.bool,
  onSegmentColorClick: PropTypes.func,
  onToggleSegmentVisibility: PropTypes.func,
  onToggleSegmentLock: PropTypes.func,
  activeSegmentationId: PropTypes.string,
};

export default SegmentationItem;
