import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PanelSection } from '../../components';
import SegmentationConfig from './SegmentationConfig';
import SegmentationDropDownRow from './SegmentationDropDownRow';
import NoSegmentationRow from './NoSegmentationRow';
import AddSegmentRow from './AddSegmentRow';
import SegmentationGroupSegment from './SegmentationGroupSegment';

const SegmentationGroupTable = ({
  segmentations,
  // segmentation initial config
  segmentationConfig,
  // UI show/hide
  disableEditing,
  showAddSegmentation,
  showAddSegment,
  showDeleteSegment,
  // segmentation/segment handlers
  onSegmentationAdd,
  onSegmentationEdit,
  onSegmentationClick,
  onSegmentationDelete,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  // segment handlers
  onSegmentClick,
  onSegmentAdd,
  onSegmentDelete,
  onSegmentEdit,
  onToggleSegmentationVisibility,
  onToggleSegmentVisibility,
  onToggleSegmentLock,
  onSegmentColorClick,
  // segmentation config handlers
  setFillAlpha,
  setFillAlphaInactive,
  setOutlineWidthActive,
  setOutlineOpacityActive,
  setRenderFill,
  setRenderInactiveSegmentations,
  setRenderOutline,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeSegmentationId, setActiveSegmentationId] = useState(null);

  const onActiveSegmentationChange = segmentationId => {
    onSegmentationClick(segmentationId);
    setActiveSegmentationId(segmentationId);
  };

  useEffect(() => {
    // find the first active segmentation to set
    let activeSegmentationIdToSet = segmentations?.find(segmentation => segmentation.isActive)?.id;

    // If there is no active segmentation, set the first one to be active
    if (!activeSegmentationIdToSet && segmentations?.length > 0) {
      activeSegmentationIdToSet = segmentations[0].id;
    }

    // If there is no segmentation, set the active segmentation to null
    if (segmentations?.length === 0) {
      activeSegmentationIdToSet = null;
    }

    setActiveSegmentationId(activeSegmentationIdToSet);
  }, [segmentations]);

  const activeSegmentation = segmentations?.find(
    segmentation => segmentation.id === activeSegmentationId
  );

  return (
    <div className="flex min-h-0 flex-col bg-black text-[13px] font-[300]">
      <PanelSection
        title="Segmentation"
        actionIcons={
          activeSegmentation && [
            {
              name: 'settings-bars',
              onClick: () => setIsConfigOpen(isOpen => !isOpen),
            },
          ]
        }
      >
        {isConfigOpen && (
          <SegmentationConfig
            setFillAlpha={setFillAlpha}
            setFillAlphaInactive={setFillAlphaInactive}
            setOutlineWidthActive={setOutlineWidthActive}
            setOutlineOpacityActive={setOutlineOpacityActive}
            setRenderFill={setRenderFill}
            setRenderInactiveSegmentations={setRenderInactiveSegmentations}
            setRenderOutline={setRenderOutline}
            segmentationConfig={segmentationConfig}
          />
        )}
        <div className="bg-primary-dark">
          {segmentations?.length === 0 ? (
            <div className="select-none rounded-[4px]">
              {showAddSegmentation && !disableEditing && (
                <NoSegmentationRow onSegmentationAdd={onSegmentationAdd} />
              )}
            </div>
          ) : (
            <div className="mt-1 select-none">
              <SegmentationDropDownRow
                segmentations={segmentations}
                disableEditing={disableEditing}
                activeSegmentation={activeSegmentation}
                onActiveSegmentationChange={onActiveSegmentationChange}
                onSegmentationDelete={onSegmentationDelete}
                onSegmentationEdit={onSegmentationEdit}
                onSegmentationDownload={onSegmentationDownload}
                onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
                storeSegmentation={storeSegmentation}
                onSegmentationAdd={onSegmentationAdd}
                onToggleSegmentationVisibility={onToggleSegmentationVisibility}
              />
              {!disableEditing && showAddSegment && (
                <AddSegmentRow onClick={() => onSegmentAdd(activeSegmentationId)} />
              )}
            </div>
          )}
        </div>
        {activeSegmentation && (
          <div className="ohif-scrollbar mt-1.5 flex min-h-0 flex-col overflow-y-hidden">
            {activeSegmentation?.segments?.map(segment => {
              if (!segment) {
                return null;
              }

              const { segmentIndex, color, label, isVisible, isLocked } = segment;
              return (
                <div
                  className="mb-[1px]"
                  key={segmentIndex}
                >
                  <SegmentationGroupSegment
                    segmentationId={activeSegmentationId}
                    segmentIndex={segmentIndex}
                    label={label}
                    color={color}
                    isActive={activeSegmentation.activeSegmentIndex === segmentIndex}
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
                  />
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>
    </div>
  );
};

SegmentationGroupTable.propTypes = {
  segmentations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      isActive: PropTypes.bool.isRequired,
      segments: PropTypes.arrayOf(
        PropTypes.shape({
          segmentIndex: PropTypes.number.isRequired,
          color: PropTypes.array.isRequired,
          label: PropTypes.string.isRequired,
          isVisible: PropTypes.bool.isRequired,
          isLocked: PropTypes.bool.isRequired,
        })
      ),
    })
  ),
  segmentationConfig: PropTypes.object.isRequired,
  disableEditing: PropTypes.bool,
  showAddSegmentation: PropTypes.bool,
  showAddSegment: PropTypes.bool,
  showDeleteSegment: PropTypes.bool,
  onSegmentationAdd: PropTypes.func.isRequired,
  onSegmentationEdit: PropTypes.func.isRequired,
  onSegmentationClick: PropTypes.func.isRequired,
  onSegmentationDelete: PropTypes.func.isRequired,
  onSegmentationDownload: PropTypes.func.isRequired,
  onSegmentationDownloadRTSS: PropTypes.func.isRequired,
  storeSegmentation: PropTypes.func.isRequired,
  onSegmentClick: PropTypes.func.isRequired,
  onSegmentAdd: PropTypes.func.isRequired,
  onSegmentDelete: PropTypes.func.isRequired,
  onSegmentEdit: PropTypes.func.isRequired,
  onToggleSegmentationVisibility: PropTypes.func.isRequired,
  onToggleSegmentVisibility: PropTypes.func.isRequired,
  onToggleSegmentLock: PropTypes.func.isRequired,
  onSegmentColorClick: PropTypes.func.isRequired,
  setFillAlpha: PropTypes.func.isRequired,
  setFillAlphaInactive: PropTypes.func.isRequired,
  setOutlineWidthActive: PropTypes.func.isRequired,
  setOutlineOpacityActive: PropTypes.func.isRequired,
  setRenderFill: PropTypes.func.isRequired,
  setRenderInactiveSegmentations: PropTypes.func.isRequired,
  setRenderOutline: PropTypes.func.isRequired,
};

SegmentationGroupTable.defaultProps = {
  segmentations: [],
  disableEditing: false,
  showAddSegmentation: true,
  showAddSegment: true,
  showDeleteSegment: true,
  onSegmentationAdd: () => {},
  onSegmentationEdit: () => {},
  onSegmentationClick: () => {},
  onSegmentationDelete: () => {},
  onSegmentationDownload: () => {},
  onSemgnetationDownloadRTSS: () => {},
  storeSegmentation: () => {},
  onSegmentClick: () => {},
  onSegmentAdd: () => {},
  onSegmentDelete: () => {},
  onSegmentEdit: () => {},
  onToggleSegmentationVisibility: () => {},
  onToggleSegmentVisibility: () => {},
  onToggleSegmentLock: () => {},
  onSegmentColorClick: () => {},
  setFillAlpha: () => {},
  setFillAlphaInactive: () => {},
  setOutlineWidthActive: () => {},
  setOutlineOpacityActive: () => {},
  setRenderFill: () => {},
  setRenderInactiveSegmentations: () => {},
  setRenderOutline: () => {},
};
export default SegmentationGroupTable;
