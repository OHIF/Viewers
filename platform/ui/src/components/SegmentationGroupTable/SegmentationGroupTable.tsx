import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import SegmentationGroup from './SegmentationGroup';
import SegmentationConfig from './SegmentationConfig';

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
  disableEditing,
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
}) => {
  return (
    <div className="font-inter flex min-h-0 flex-col font-[300]">
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
      <div className="mt-1 flex min-h-0 flex-col pr-[1px]">
        {!!segmentations.length &&
          segmentations.map((segmentation, index) => {
            const {
              id,
              label,
              displayText = [],
              segmentCount,
              segments,
              isVisible,
              isActive,
              activeSegmentIndex,
            } = segmentation;
            return (
              <SegmentationGroup
                id={id}
                key={id}
                label={label}
                disableEditing={disableEditing}
                isMinimized={isMinimized[id]}
                segments={segments}
                showAddSegment={showAddSegment}
                segmentCount={segmentCount}
                isActive={isActive}
                isVisible={isVisible}
                onSegmentColorClick={onSegmentColorClick}
                onSegmentationClick={() => onSegmentationClick(id)}
                activeSegmentIndex={activeSegmentIndex}
                onToggleMinimizeSegmentation={onToggleMinimizeSegmentation}
                onSegmentationEdit={onSegmentationEdit}
                onSegmentationDelete={onSegmentationDelete}
                onSegmentClick={onSegmentClick}
                onSegmentEdit={onSegmentEdit}
                onToggleSegmentVisibility={onToggleSegmentVisibility}
                onToggleSegmentationVisibility={onToggleSegmentationVisibility}
                onSegmentAdd={onSegmentAdd}
                showSegmentDelete={false}
              />
            );
          })}
      </div>
      {showAddSegmentation && !disableEditing && (
        <div
          className="text-primary-active flex h-[45px] cursor-pointer items-center bg-black pl-1 text-[12px] hover:opacity-80"
          onClick={() => onSegmentationAdd()}
        >
          <Icon
            name="row-add"
            className="h-5 w-5"
          />
          <div className="pl-1">Add New Segmentation</div>
        </div>
      )}
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
