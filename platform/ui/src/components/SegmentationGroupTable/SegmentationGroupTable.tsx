import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import SegmentationGroup from './SegmentationGroup';
import { PanelSection, Select } from '../../components';
import SegmentationConfig from './SegmentationConfig';
import SegmentationDropDownRow from './SegmentationDropDownRow';
import NoSegmentationRow from './NoSegmentationRow';
import AddSegmentRow from './AddSegmentRow';
import SegmentItem from './SegmentationGroupSegment';

const SegmentationGroupTable = ({
  segmentations,
  onSegmentationAdd,
  onSegmentationEdit,
  onSegmentationClick,
  onSegmentationDelete,
  showAddSegmentation,
  showAddSegment,
  onSegmentClick,
  onSegmentAdd,
  segmentationConfig,
  onSegmentDelete,
  onSegmentEdit,
  onToggleSegmentationVisibility,
  onToggleSegmentVisibility,
  onSegmentColorClick,
  isMinimized,
  onToggleMinimizeSegmentation,
  setFillAlpha,
  setFillAlphaInactive,
  setOutlineWidthActive,
  setOutlineOpacityActive,
  setRenderFill,
  setRenderInactiveSegmentations,
  setRenderOutline,
  showDeleteSegment,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeSegmentationId, setActiveSegmentationId] = useState(
    segmentations[0].id
  );

  const handleActiveSegmentationChange = segmentation => {
    onSegmentationClick(segmentation);
    setActiveSegmentationId(segmentation.id);
  };

  const activeSegmentation = segmentations?.find(
    segmentation => segmentation.id === activeSegmentationId
  );

  return (
    <div className="flex flex-col min-h-0 font-inter font-[300] text-xs">
      <PanelSection
        title="Segmentation"
        actionIcons={[
          {
            name: 'settings-bars',
            onClick: () => setIsConfigOpen(!isConfigOpen),
          },
        ]}
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
        <div className="bg-black">
          {segmentations?.length === 0 ? (
            <div className=" mt-1 select-none">
              <NoSegmentationRow />
            </div>
          ) : (
            <div className=" mt-1 select-none">
              <SegmentationDropDownRow
                segmentations={segmentations}
                onActiveSegmentationChange={handleActiveSegmentationChange}
              />
              <AddSegmentRow />
            </div>
          )}
        </div>
        <div className="flex flex-col min-h-0 ohif-scrollbar overflow-y-hidden">
          {activeSegmentation?.segments?.map(segment => {
            if (segment === undefined || segment === null) {
              return null;
            }

            const { segmentIndex, color, label, isVisible, isLocked } = segment;
            return (
              <div className="mb-[1px]" key={segmentIndex}>
                <SegmentItem
                  segmentationId={activeSegmentationId}
                  segmentIndex={segmentIndex}
                  label={label}
                  color={color}
                  isActive={
                    activeSegmentation.activeSegmentIndex === segmentIndex
                  }
                  isLocked={isLocked}
                  isVisible={isVisible}
                  onClick={onSegmentClick}
                  onEdit={onSegmentEdit}
                  onDelete={onSegmentDelete}
                  showDelete={showDeleteSegment}
                  onColor={onSegmentColorClick}
                  onToggleVisibility={onToggleSegmentVisibility}
                />
              </div>
            );
          })}
        </div>
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
