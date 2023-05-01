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
    <div className="flex flex-col min-h-0 font-inter font-[300]">
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
      <div className="flex flex-col min-h-0 pr-[1px] mt-1">
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
      {showAddSegmentation && (
        <div
          className="flex items-center cursor-pointer hover:opacity-80 text-primary-active bg-black text-[12px] pl-1 h-[45px]"
          onClick={() => onSegmentationAdd()}
        >
          <Icon name="row-add" className="w-5 h-5" />
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
