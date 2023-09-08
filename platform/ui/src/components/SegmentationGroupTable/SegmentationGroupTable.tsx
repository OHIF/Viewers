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
  }, [segmentations, activeSegmentationId]);

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
              onClick: () => setIsConfigOpen(!isConfigOpen),
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
          <div className="ohif-scrollbar mt-1 flex min-h-0 flex-col overflow-y-hidden">
            {activeSegmentation?.segments?.map(segment => {
              if (segment === undefined || segment === null) {
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
  title: PropTypes.string.isRequired,
  segmentations: PropTypes.array.isRequired,
  activeSegmentationId: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleLocked: PropTypes.func,
  onToggleVisibility: PropTypes.func.isRequired,
  onToggleVisibilityAll: PropTypes.func.isRequired,
  segmentationConfig: PropTypes.object,
  disableEditing: PropTypes.bool,
};

SegmentationGroupTable.defaultProps = {
  title: '',
  segmentations: [],
  activeSegmentationId: '',
  showAddSegmentation: true,
  showAddSegment: true,
  onClick: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onToggleLocked: () => {},
  onToggleVisibility: () => {},
  onToggleVisibilityAll: () => {},
  segmentationConfig: {
    initialConfig: {
      fillAlpha: 0.5,
      fillAlphaInactive: 0.5,
      outlineWidthActive: 1,
      outlineOpacity: 1,
      outlineOpacityInactive: 0.5,
      renderFill: true,
      renderInactiveSegmentations: true,
      renderOutline: true,
    },
  },
  setFillAlpha: () => {},
  setFillAlphaInactive: () => {},
  setOutlineWidthActive: () => {},
  setOutlineOpacityActive: () => {},
  setRenderFill: () => {},
  setRenderInactiveSegmentations: () => {},
  setRenderOutline: () => {},
};

export default SegmentationGroupTable;
